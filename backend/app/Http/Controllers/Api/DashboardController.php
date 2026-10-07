<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        // Distinct people you work with across all your projects (not counting you)
        $teammates = DB::table('project_members')
            ->whereIn('project_id', $projectIds)
            ->where('user_id', '!=', $user->id)
            ->distinct()
            ->count('user_id');

        return response()->json([
            'stats' => [
                'projects' => $projectIds->count(),
                'leading' => (clone $projects)->wherePivot('role', 'leader')->count(),
                'teammates' => $teammates,
                'due_soon' => (clone $projects)->whereBetween('deadline', [now()->startOfDay(), now()->addDays(14)])->count(),
            ],
            'plan' => [
                'name' => 'Free',
                'max_projects' => config('squadboard.free.max_projects'),
            ],
        ]);
    }
}