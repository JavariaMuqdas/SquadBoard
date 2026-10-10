<?php

namespace App\Services;

use App\Exceptions\InvitationException;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class InvitationService
{
    public function __construct(private Notifier $notifier)
    {
    }

    /** Loads a usable invitation from its plain token, or throws. */
    public function resolve(?string $plainToken): Invitation
    {
        $invitation = Invitation::findByToken($plainToken);

        if (! $invitation) {
            throw InvitationException::invalid();
        }

        if (! $invitation->isUsable()) {
            throw InvitationException::notUsable($invitation->status());
        }

        return $invitation;
    }

    /** Adds the user to the invited project. Safe to call if they're already a member. */
    public function accept(Invitation $invitation, User $user): Project
    {
        if (! $invitation->matchesEmail($user->email)) {
            throw InvitationException::emailMismatch($invitation->email);
        }

        $joined = false;

        $project = DB::transaction(function () use ($invitation, $user, &$joined) {
            $project = $invitation->project;

            // Never downgrade an existing membership (e.g. a leader re-invited as member)
            if (! $project->members()->whereKey($user->id)->exists()) {
                $project->members()->attach($user->id, [
                    'role' => $invitation->role,
                    'joined_at' => now(),
                ]);
                $joined = true;
            }

            $invitation->forceFill(['accepted_at' => now()])->save();

            // Clicking the emailed link proves the user owns this address
            if (! $user->email_verified_at) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            return $project;
        });

        if ($joined) {
            $this->notifier->memberJoined($project, $user, $invitation->role);
        }

        return $project;
    }
}