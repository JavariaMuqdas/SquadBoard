<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Project;
use App\Services\ProjectInviteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectInvitationController extends Controller
{
    public function store(Request $request, Project $project, ProjectInviteService $invites): JsonResponse
    {
        Gate::authorize('manageMembers', $project);

        $data = $request->validate([
            'emails' => ['required', 'array', 'min:1', 'max:10'],
            'emails.*' => ['required', 'email:rfc', 'max:255'],
            'role' => ['required', 'in:member,supervisor'],
        ], [
            'emails.required' => 'Add at least one email address.',
            'emails.*.email' => 'One of the emails is not valid.',
        ]);

        $result = $invites->invite($project, $request->user(), $data['emails'], $data['role']);

        return response()->json($result, $result['sent'] ? 201 : 200);
    }

    public function resend(Project $project, Invitation $invitation, ProjectInviteService $invites): JsonResponse
    {
        Gate::authorize('manageMembers', $project);
        abort_if($invitation->accepted_at !== null, 422, 'This invitation was already accepted.');

        $link = $invites->resend($invitation);

        return response()->json(['message' => "Invitation re-sent to {$invitation->email}.", 'dev_link' => $link]);
    }

    public function destroy(Project $project, Invitation $invitation): JsonResponse
    {
        Gate::authorize('manageMembers', $project);
        abort_if($invitation->accepted_at !== null, 422, 'This invitation was already accepted.');

        $invitation->forceFill(['revoked_at' => now()])->save();

        return response()->json(['message' => 'Invitation cancelled.']);
    }
}