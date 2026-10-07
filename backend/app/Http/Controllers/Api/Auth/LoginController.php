<?php

namespace App\Http\Controllers\Api\Auth;

use App\Exceptions\InvitationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(LoginRequest $request, InvitationService $invites): JsonResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();
        $joined = null;
        $inviteError = null;

        // Existing user arriving from an invite link: accept it right after login.
        // A bad invite never blocks the login itself.
        if ($token = $request->input('invite_token')) {
            try {
                $invitation = $invites->resolve($token);
                $project = $invites->accept($invitation, $user);
                $joined = ['id' => $project->id, 'name' => $project->name, 'role' => $invitation->role];
            } catch (InvitationException $e) {
                $inviteError = ['reason' => $e->reason, 'message' => $e->getMessage()];
            }
        }

        return response()->json([
            'user' => new UserResource($user->loadCount('projects')),
            'joined_project' => $joined,
            'invite_error' => $inviteError,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->loadCount('projects'));
    }
}
