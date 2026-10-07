<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectInvitation extends Notification
{
    use Queueable;

    public function __construct(public Invitation $invitation, public string $plainToken)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $invitation = $this->invitation;
        $project = $invitation->project;
        $inviter = $invitation->inviter->name;
        $isSupervisor = $invitation->role === 'supervisor';

        $roleDescription = $isSupervisor
            ? 'As the project supervisor, you will have read-only access to the team’s task board, progress updates and contribution reports. This lets you follow the project closely and assess each student’s work fairly, without needing to request status updates.'
            : 'As a team member, you will be able to view the project board, see the tasks assigned to you, and record your progress. Every update you make is credited to you in the team’s contribution report.';

        $details = array_filter([
            'Project' => $project->name,
            'Course' => $project->course,
            'Your role' => $isSupervisor ? 'Supervisor' : 'Team member',
            'Invited by' => $inviter,
            'Project deadline' => $project->deadline?->format('j F Y'),
            'Team size' => $project->members()->count().' '.($project->members()->count() === 1 ? 'person' : 'people'),
        ]);

        return (new MailMessage)
            ->subject("{$inviter} invited you to join “{$project->name}” on SquadBoard")
            ->view(
                ['emails.project-invitation', 'emails.project-invitation-text'],
                [
                    'projectName' => $project->name,
                    'inviterName' => $inviter,
                    'roleLabel' => $isSupervisor ? 'Supervisor' : 'Team member',
                    'roleArticle' => 'a',
                    'roleDescription' => $roleDescription,
                    'details' => $details,
                    'url' => rtrim(config('squadboard.frontend_url'), '/').'/invite/'.$this->plainToken,
                    'expiresAt' => $invitation->expires_at->format('j F Y'),
                    'recipient' => $invitation->email,
                ]
            );
    }
}