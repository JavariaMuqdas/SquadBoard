<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectInvitation;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Notification;

class ProjectInviteService
{
    /**
     * Invites several emails at once.
     * Returns ['sent' => [...], 'skipped' => [['email' => ..., 'reason' => ...]], 'dev_links' => [...]]
     */
    public function invite(Project $project, User $inviter, array $emails, string $role): array
    {
        $emails = collect($emails)->map(fn ($e) => mb_strtolower(trim($e)))->filter()->unique()->values();

        $memberEmails = $project->members()->pluck('email')->all();
        $sent = [];
        $skipped = [];
        $toInvite = [];

        foreach ($emails as $email) {
            if ($email === $inviter->email) {
                $skipped[] = ['email' => $email, 'reason' => 'That’s you.'];
            } elseif (in_array($email, $memberEmails, true)) {
                $skipped[] = ['email' => $email, 'reason' => 'Already in this project.'];
            } else {
                $toInvite[] = $email;
            }
        }

        // Free plan: leader + members (+ pending member invites) can't exceed the limit. Supervisors don't count.
        if ($role === 'member' && $toInvite) {
            $max = config('squadboard.free.max_members');
            $members = $project->members()->wherePivotIn('role', ['leader', 'member'])->count();
            $pending = $project->invitations()->where('role', 'member')->whereNull('accepted_at')
                ->whereNull('revoked_at')->where('expires_at', '>', now())
                ->whereNotIn('email', $toInvite)->count();

            if ($members + $pending + count($toInvite) > $max) {
                $left = max(0, $max - $members - $pending);
                throw new HttpResponseException(response()->json([
                    'message' => "The free plan allows {$max} people per team (including you). You can invite {$left} more.",
                    'reason' => 'member_limit',
                ], 403));
            }
        }

        $devLinks = [];
        foreach ($toInvite as $email) {
            // Re-inviting someone with a pending invite refreshes it instead of creating a duplicate
            $existing = $project->invitations()->where('email', $email)->whereNull('accepted_at')->latest()->first();

            if ($existing) {
                $existing->forceFill(['role' => $role, 'invited_by' => $inviter->id])->save();
                $plain = $existing->refreshToken();
                $invitation = $existing;
            } else {
                [$invitation, $plain] = Invitation::issue($project, $inviter, $email, $role);
            }

            $this->send($invitation->load(['project', 'inviter']), $plain);
            $sent[] = $email;
            $devLinks[$email] = $this->devLink($plain);
        }

        return ['sent' => $sent, 'skipped' => $skipped, 'dev_links' => array_filter($devLinks)];
    }

    public function resend(Invitation $invitation): ?string
    {
        $plain = $invitation->refreshToken();
        $this->send($invitation->load(['project', 'inviter']), $plain);

        return $this->devLink($plain);
    }

    private function send(Invitation $invitation, string $plain): void
    {
        Notification::route('mail', $invitation->email)->notify(new ProjectInvitation($invitation, $plain));
    }

    /** In local development the link is returned to the UI so you can test without a real mailbox. */
    private function devLink(string $plain): ?string
    {
        return app()->isLocal() || config('squadboard.show_invite_links')
            ? rtrim(config('squadboard.frontend_url'), '/').'/invite/'.$plain
            : null;
    }
}