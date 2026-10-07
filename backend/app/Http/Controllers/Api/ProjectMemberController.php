<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    /** Leader removes someone, or a member/supervisor leaves the project themselves. */
    public function destroy(Request $request, Project $project, User $user): JsonResponse
    {
        $me = $request->user();
        $myRole = $me->roleIn($project);
        $theirRole = $user->roleIn($project);

        abort_if($theirRole === null, 404, 'This person is not in the project.');
        abort_if($theirRole === 'leader', 422, 'The team leader can’t be removed.');

        $isSelf = $me->id === $user->id;
        abort_unless($isSelf || $myRole === 'leader', 403, 'Only the team leader can remove people.');

        $project->members()->detach($user->id);

        return response()->json([
            'message' => $isSelf ? "You left {$project->name}." : "{$user->name} was removed from the project.",
        ]);
    }
}