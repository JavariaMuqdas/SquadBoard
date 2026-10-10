<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\TaskUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    /** GET /api/projects?status=active|archived|all */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->query('status', 'active');

        $projects = $request->user()->projects()
            ->with('members:users.id,users.name,users.avatar')
            ->withCount(['members', 'tasks', 'tasks as tasks_done_count' => fn ($q) => $q->where('status', 'done')])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status === 'archived' ? 'archived' : 'active'))
            ->orderByRaw('deadline IS NULL, deadline asc')
            ->get();

        return ProjectResource::collection($projects);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $user = $request->user();
        $limit = config('squadboard.free.max_projects');

        $leading = $user->projects()->wherePivot('role', 'leader')->where('status', 'active')->count();
        if ($leading >= $limit) {
            return response()->json([
                'message' => "The free plan lets you lead {$limit} active projects. Archive one or upgrade to create more.",
                'reason' => 'plan_limit',
            ], 403);
        }

        $project = DB::transaction(function () use ($request, $user) {
            $project = Project::create([
                ...$request->validated(),
                'color' => $request->validated('color') ?? 'indigo',
                'owner_id' => $user->id,
            ]);
            $project->members()->attach($user->id, ['role' => 'leader', 'joined_at' => now()]);

            return $project;
        });

        return (new ProjectResource($this->loadForUser($request, $project->id)))->response()->setStatusCode(201);
    }

    /** Full project page data: details, members, invitations (leader), task stats and recent activity. */
    public function show(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $user = $request->user();
        $project = $this->loadForUser($request, $project->id);
        $role = $project->pivot->role;
        $isLeader = $role === 'leader';

        $members = $project->members()
            ->orderByRaw("CASE project_members.role WHEN 'leader' THEN 0 WHEN 'member' THEN 1 ELSE 2 END")
            ->orderBy('project_members.joined_at')
            ->get(['users.id', 'users.name', 'users.email', 'users.avatar'])
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'avatar' => $m->avatar,
                'role' => $m->pivot->role,
                'joined_at' => $m->pivot->joined_at,
                'is_me' => $m->id === $user->id,
            ]);

        $invitations = $isLeader
            ? $project->invitations()->whereNull('accepted_at')->whereNull('revoked_at')->latest()->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'email' => $i->email,
                    'role' => $i->role,
                    'status' => $i->status(),
                    'sent_at' => $i->updated_at,
                    'expires_at' => $i->expires_at,
                ])
            : [];

        $max = config('squadboard.free.max_members');
        $used = $members->whereIn('role', ['leader', 'member'])->count()
            + collect($invitations)->where('role', 'member')->where('status', 'pending')->count();

        $byStatus = $project->tasks()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        $activity = TaskUpdate::with(['user:id,name,avatar', 'task:id,title'])
            ->where('project_id', $project->id)
            ->latest('created_at')->latest('id')->limit(8)->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'new_status' => $a->new_status,
                'progress' => $a->progress,
                'note' => $a->note,
                'created_at' => $a->created_at,
                'user' => ['id' => $a->user->id, 'name' => $a->user->name, 'avatar' => $a->user->avatar],
                'task' => ['id' => $a->task->id, 'title' => $a->task->title],
            ]);

        return response()->json([
            'data' => [
                ...(new ProjectResource($project))->toArray($request),
                'owner_id' => $project->owner_id,
                'members' => $members,
                'invitations' => $invitations,
                'limits' => ['max_members' => $max, 'used' => $used],
                'task_stats' => [
                    'todo' => (int) ($byStatus['todo'] ?? 0),
                    'in_progress' => (int) ($byStatus['in_progress'] ?? 0),
                    'review' => (int) ($byStatus['review'] ?? 0),
                    'done' => (int) ($byStatus['done'] ?? 0),
                    'overdue' => $project->tasks()->where('status', '!=', 'done')->whereDate('due_date', '<', today())->count(),
                ],
                'activity' => $activity,
                'permissions' => [
                    'manage_members' => $isLeader,
                    'edit_project' => $isLeader,
                    'manage_tasks' => in_array($role, ['leader', 'supervisor'], true),
                ],
            ],
        ]);
    }

    public function update(Request $request, Project $project): ProjectResource
    {
        Gate::authorize('update', $project);

        $project->update($request->validate([
            'name' => ['sometimes', 'string', 'min:3', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'course' => ['nullable', 'string', 'max:100'],
            'deadline' => ['nullable', 'date'],
            'color' => ['sometimes', Rule::in(config('squadboard.project_colors'))],
        ]));

        return new ProjectResource($this->loadForUser($request, $project->id));
    }

    /** Toggle between active and archived. Archived projects don't count toward the free-plan limit. */
    public function archive(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $restoring = $project->status === 'archived';

        if ($restoring) {
            $limit = config('squadboard.free.max_projects');
            $leading = $request->user()->projects()->wherePivot('role', 'leader')->where('status', 'active')->count();
            abort_if($leading >= $limit, 403, "The free plan lets you lead {$limit} active projects. Archive another project first.");
        }

        $project->update(['status' => $restoring ? 'active' : 'archived']);

        return response()->json([
            'status' => $project->status,
            'message' => $restoring ? 'Project restored.' : 'Project archived. You can restore it any time.',
        ]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $request->validate(['confirm' => ['required', 'string']]);
        abort_unless(trim($request->confirm) === $project->name, 422, 'Type the project name exactly to confirm.');

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    private function loadForUser(Request $request, int $id): Project
    {
        return $request->user()->projects()
            ->with('members:users.id,users.name,users.avatar')
            ->withCount(['members', 'tasks', 'tasks as tasks_done_count' => fn ($q) => $q->where('status', 'done')])
            ->findOrFail($id);
    }
}