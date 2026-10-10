<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MyTaskController extends Controller
{
    /** Every task assigned to me across my active projects. */
    public function __invoke(Request $request): JsonResponse
    {
        $tasks = Task::query()
            ->with(['project:id,name,color', 'assignee:id,name,avatar'])
            ->withCount('updates')
            ->where('assigned_to', $request->user()->id)
            ->whereHas('project', fn ($q) => $q->where('status', 'active'))
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'review' THEN 2 ELSE 3 END")
            ->orderByRaw('due_date IS NULL, due_date asc')
            ->get();

        return response()->json([
            'data' => TaskResource::collection($tasks),
            'counts' => [
                'all' => $tasks->count(),
                'todo' => $tasks->where('status', 'todo')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'review' => $tasks->where('status', 'review')->count(),
                'done' => $tasks->where('status', 'done')->count(),
                'overdue' => $tasks->filter->isOverdue()->count(),
            ],
        ]);
    }
}