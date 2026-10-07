<?php

namespace App\Http\Controllers\Api\Auth;

use App\Exceptions\InvitationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, InvitationService $invites): JsonResponse
    {
        $data = $request->validated();
        $invitation = null;

        if (! empty($data['invite_token'])) {
            $invitation = $invites->resolve($data['invite_token']);

            // The signup email is locked to the invited address
            if (! $invitation->matchesEmail($data['email'])) {
                throw InvitationException::emailMismatch($invitation->email);
            }

            // Supervisor invites create supervisor accounts; member invites create student accounts
            $data['role'] = $invitation->role === 'supervisor' ? User::ROLE_SUPERVISOR : User::ROLE_STUDENT;
        }

        [$user, $project] = DB::transaction(function () use ($data, $invitation, $invites) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
            ]);

            $project = $invitation ? $invites->accept($invitation, $user) : null;

            return [$user, $project];
        });

        // Sends the verification email only for non-invited signups (invited emails are already verified)
        if (! $user->hasVerifiedEmail()) {
            event(new Registered($user));
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => new UserResource($user->fresh()),
            'joined_project' => $project ? [
                'id' => $project->id,
                'name' => $project->name,
                'role' => $invitation->role,
            ] : null,
        ], 201);
    }
}
