<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $projects = $user->projects()->where('status', 'active');
        $projectIds = (clone $projects)->pluck('projects.id');

        $teammates = DB::table('project_members')
            ->whereIn('project_id', $projectIds)
            ->where('user_id', '!=', $user->id)
            ->distinct()
            ->count('user_id');

        $myOpen = Task::with('project:id,name,color')
            ->whereIn('project_id', $projectIds)
            ->where('assigned_to', $user->id)
            ->where('status', '!=', 'done')
            ->orderByRaw('due_date IS NULL, due_date asc')
            ->get();

        return response()->json([
            'stats' => [
                'projects' => $projectIds->count(),
                'leading' => (clone $projects)->wherePivot('role', 'leader')->count(),
                'teammates' => $teammates,
                'due_soon' => (clone $projects)->whereBetween('deadline', [now()->startOfDay(), now()->addDays(14)])->count(),
                'open_tasks' => $myOpen->count(),
                'overdue_tasks' => $myOpen->filter->isOverdue()->count(),
            ],
            'my_tasks' => TaskResource::collection($myOpen->take(5)),
            'has_tasks' => Task::whereIn('project_id', $projectIds)->exists(),
            'plan' => [
                'name' => 'Free',
                'max_projects' => config('squadboard.free.max_projects'),
            ],
        ]);
    }
}