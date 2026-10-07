<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InvitationException;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    /** Public preview shown on /invite/:token before the person signs up or logs in. */
    public function show(string $token): JsonResponse
    {
        $invitation = Invitation::findByToken($token);

        if (! $invitation) {
            throw InvitationException::invalid();
        }

        return response()->json([
            'status' => $invitation->status(),
            'email' => $invitation->email,
            'role' => $invitation->role,
            'expires_at' => $invitation->expires_at,
            'account_exists' => User::where('email', $invitation->email)->exists(),
            'invited_by' => $invitation->inviter->name,
            'project' => [
                'name' => $invitation->project->name,
                'description' => $invitation->project->description,
                'deadline' => $invitation->project->deadline?->toDateString(),
                'members_count' => $invitation->project->members()->count(),
            ],
        ]);
    }

    /** Logged-in user accepts an invite. */
    public function accept(Request $request, string $token, InvitationService $invites): JsonResponse
    {
        $invitation = $invites->resolve($token);
        $project = $invites->accept($invitation, $request->user());

        return response()->json([
            'message' => "You joined {$project->name}.",
            'joined_project' => ['id' => $project->id, 'name' => $project->name, 'role' => $invitation->role],
        ]);
    }
}
