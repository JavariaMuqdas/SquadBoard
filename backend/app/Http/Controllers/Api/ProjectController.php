<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    /** Projects the logged-in user belongs to (any role). */
    public function index(Request $request): AnonymousResourceCollection
    {
        $projects = $request->user()->projects()
            ->with('members:users.id,users.name,users.avatar')
            ->withCount('members')
            ->where('status', 'active')
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

        // Reload through the user so pivot (my_role) and counts are present
        $project = $user->projects()
            ->with('members:users.id,users.name,users.avatar')
            ->withCount('members')
            ->findOrFail($project->id);

        return (new ProjectResource($project))->response()->setStatusCode(201);
    }

    /** Full project page data: details, every member, and (for the leader) open invitations. */
    public function show(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $user = $request->user();
        $project = $user->projects()->withCount('members')->findOrFail($project->id);
        $isLeader = $project->pivot->role === 'leader';

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

        return response()->json([
            'data' => [
                ...(new ProjectResource($project))->toArray($request),
                'owner_id' => $project->owner_id,
                'members' => $members,
                'invitations' => $invitations,
                'limits' => ['max_members' => $max, 'used' => $used],
                'permissions' => ['manage_members' => $isLeader],
            ],
        ]);
    }
}