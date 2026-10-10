<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

/**
 * Contribution report. Built only from data the system recorded (tasks + activity log),
 * so nobody can claim someone else's work.
 *
 * Contribution score = 60% share of completed effort points
 *                    + 20% on-time delivery rate
 *                    + 20% share of activity (updates, notes, status changes)
 */
class ReportController extends Controller
{
    public function __invoke(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $tasks = $project->tasks()->get();
        $done = $tasks->where('status', 'done');
        $donePoints = max(1, $done->sum('effort'));

        $activity = TaskUpdate::where('project_id', $project->id)
            ->selectRaw('user_id, COUNT(*) as total, MAX(created_at) as last_at')
            ->groupBy('user_id')->get()->keyBy('user_id');
        $activityTotal = max(1, $activity->sum('total'));

        $members = $project->workers()->get(['users.id', 'users.name', 'users.email', 'users.avatar'])
            ->map(function ($user) use ($tasks, $donePoints, $activity, $activityTotal) {
                $mine = $tasks->where('assigned_to', $user->id);
                $mineDone = $mine->where('status', 'done');
                $open = $mine->where('status', '!=', 'done');

                $onTime = $mineDone->filter(fn (Task $t) => ! $t->due_date || $t->completed_at?->lte($t->due_date->copy()->endOfDay()))->count();
                $onTimeRate = $mineDone->count() ? round($onTime / $mineDone->count() * 100) : null;
                $share = round($mineDone->sum('effort') / $donePoints * 100, 1);
                $updates = (int) ($activity->get($user->id)?->total ?? 0);
                $activityShare = round($updates / $activityTotal * 100, 1);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->pivot->role,
                    'tasks_assigned' => $mine->count(),
                    'tasks_done' => $mineDone->count(),
                    'tasks_open' => $open->count(),
                    'tasks_overdue' => $open->filter->isOverdue()->count(),
                    'points_assigned' => $mine->sum('effort'),
                    'points_done' => $mineDone->sum('effort'),
                    'share' => $share,
                    'on_time_rate' => $onTimeRate,
                    'avg_progress' => $open->count() ? (int) round($open->avg('progress')) : null,
                    'updates' => $updates,
                    'activity_share' => $activityShare,
                    'last_active_at' => $activity->has($user->id) ? Carbon::parse($activity->get($user->id)->last_at) : null,
                    'score' => round(0.6 * $share + 0.2 * ($onTimeRate ?? 0) + 0.2 * $activityShare),
                ];
            })
            ->sortByDesc('score')->values();

        // Completed effort points per week, last 6 weeks
        $weeks = collect(range(5, 0))->map(function ($ago) use ($done) {
            $start = now()->startOfWeek()->subWeeks($ago);
            $end = $start->copy()->endOfWeek();

            return [
                'label' => $start->format('j M'),
                'points' => $done->filter(fn ($t) => $t->completed_at?->between($start, $end))->sum('effort'),
            ];
        });

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'course' => $project->course,
                'color' => $project->color,
                'deadline' => $project->deadline?->toDateString(),
                'supervisors' => $project->usersWithRole('supervisor')->pluck('name'),
            ],
            'totals' => [
                'tasks' => $tasks->count(),
                'done' => $done->count(),
                'in_review' => $tasks->where('status', 'review')->count(),
                'overdue' => $tasks->filter->isOverdue()->count(),
                'points' => $tasks->sum('effort'),
                'points_done' => $done->sum('effort'),
                'completion' => $tasks->count() ? (int) round($done->count() / $tasks->count() * 100) : 0,
                'unassigned' => $tasks->whereNull('assigned_to')->count(),
            ],
            'members' => $members,
            'weekly' => $weeks,
            'generated_at' => now(),
        ]);
    }
}