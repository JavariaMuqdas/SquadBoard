<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function __construct(private TaskService $tasks)
    {
    }

    /** Board data: every task, the people tasks can be assigned to, and what I'm allowed to do. */
    public function index(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $tasks = $project->tasks()
            ->with('assignee:id,name,avatar')
            ->withCount('updates')
            ->orderBy('position')->orderBy('id')
            ->get();

        $role = $request->user()->roleIn($project);

        return response()->json([
            'data' => TaskResource::collection($tasks),
            'assignees' => $project->workers()->get(['users.id', 'users.name', 'users.avatar'])
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'avatar' => $u->avatar, 'role' => $u->pivot->role]),
            'permissions' => [
                'role' => $role,
                'user_id' => $request->user()->id,
                'manage_tasks' => in_array($role, ['leader', 'supervisor'], true),
            ],
        ]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('manageTasks', $project);

        $task = $this->tasks->create($project, $request->user(), $request->validate($this->rules($project)));

        return (new TaskResource($task))->response()->setStatusCode(201);
    }

    /** Task details with its full activity history. */
    public function show(Task $task): JsonResponse
    {
        Gate::authorize('view', $task->project);

        $task->load(['assignee:id,name,avatar', 'creator:id,name']);
        $updates = $task->updates()->with('user:id,name,avatar')->latest('created_at')->latest('id')->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'type' => $u->type,
                'old_status' => $u->old_status,
                'new_status' => $u->new_status,
                'progress' => $u->progress,
                'note' => $u->note,
                'proof_url' => $u->proof_url,
                'created_at' => $u->created_at,
                'user' => ['id' => $u->user->id, 'name' => $u->user->name, 'avatar' => $u->user->avatar],
            ]);

        return response()->json(['data' => [...(new TaskResource($task))->resolve(), 'updates' => $updates]]);
    }

    public function update(Request $request, Task $task): TaskResource
    {
        Gate::authorize('manageTasks', $task->project);

        $data = $request->validate($this->rules($task->project, partial: true));

        return new TaskResource($this->tasks->update($task, $request->user(), $data));
    }

    /** Drag & drop: change column and/or position. */
    public function move(Request $request, Task $task): TaskResource
    {
        Gate::authorize('workOnTask', [$task->project, $task]);

        $data = $request->validate([
            'status' => ['required', Rule::in(Task::STATUSES)],
            'position' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        return new TaskResource(
            $this->tasks->move($task, $request->user(), $data['status'], $data['position'] ?? null, $data['note'] ?? null)
        );
    }

    /** Progress update / note / proof link from the assignee, or a comment from leader/supervisor. */
    public function addUpdate(Request $request, Task $task): TaskResource
    {
        Gate::authorize('workOnTask', [$task->project, $task]);

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000', 'required_without:progress'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'proof_url' => ['nullable', 'url', 'max:500'],
        ], ['note.required_without' => 'Write a note or change the progress.']);

        return new TaskResource($this->tasks->addUpdate(
            $task, $request->user(), $data['note'] ?? null, $data['progress'] ?? null, $data['proof_url'] ?? null
        ));
    }

    public function destroy(Task $task): JsonResponse
    {
        Gate::authorize('manageTasks', $task->project);
        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    private function rules(Project $project, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        $workerIds = $project->workers()->pluck('users.id')->all();

        return [
            'title' => [$req, 'string', 'min:3', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(Task::STATUSES)],
            'priority' => ['sometimes', Rule::in(Task::PRIORITIES)],
            'effort' => ['sometimes', 'integer', Rule::in(Task::EFFORTS)],
            'assigned_to' => ['nullable', 'integer', Rule::in($workerIds)],
            'due_date' => ['nullable', 'date'],
        ];
    }
}