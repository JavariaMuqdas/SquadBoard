<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * One in-app notification type for everything. Stored in the `notifications` table.
 * `kind` tells the React app which icon and colour to show.
 */
class SquadNotification extends Notification
{
    use Queueable;

    public function __construct(public array $payload)
    {
    }

    public static function make(
        string $kind,
        string $title,
        string $body,
        ?string $url = null,
        ?User $actor = null,
        ?Project $project = null,
    ): self {
        return new self([
            'kind' => $kind,
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'actor' => $actor ? ['id' => $actor->id, 'name' => $actor->name, 'avatar' => $actor->avatar] : null,
            'project' => $project ? ['id' => $project->id, 'name' => $project->name, 'color' => $project->color] : null,
        ]);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }
}
