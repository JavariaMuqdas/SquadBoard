<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\SquadNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

/** Decides who hears about what. The person who did the action is never notified. */
class Notifier
{
    public function memberJoined(Project $project, User $newcomer, string $role): void
    {
        $as = $role === 'supervisor' ? 'supervisor' : 'team member';

        $this->send(
            $project->usersWithRole('leader'),
            SquadNotification::make('member_joined', "{$newcomer->name} joined {$project->name}",
                "They accepted your invitation and joined as {$as}.",
                "/app/projects/{$project->id}?tab=members", $newcomer, $project),
            $newcomer,
        );
    }

    public function memberLeft(Project $project, User $user): void
    {
        $this->send(
            $project->usersWithRole('leader'),
            SquadNotification::make('member_left', "{$user->name} left {$project->name}",
                'Their open tasks are now unassigned.',
                "/app/projects/{$project->id}?tab=members", $user, $project),
            $user,
        );
    }

    public function removedFromProject(Project $project, User $user, User $actor): void
    {
        $this->send(
            collect([$user]),
            SquadNotification::make('removed', "You were removed from {$project->name}",
                "{$actor->name} removed you from the project.", '/app', $actor, $project),
            $actor,
        );
    }

    public function taskAssigned(Task $task, User $actor): void
    {
        if (! $task->assignee) {
            return;
        }

        $due = $task->due_date ? ' Due '.$task->due_date->format('j M').'.' : '';
        $this->send(
            collect([$task->assignee]),
            SquadNotification::make('task_assigned', "New task: {$task->title}",
                "{$actor->name} assigned this task to you.{$due}",
                $this->taskUrl($task), $actor, $task->project),
            $actor,
        );
    }

    public function taskSubmitted(Task $task, User $actor): void
    {
        $this->send(
            $task->project->usersWithRole('leader', 'supervisor'),
            SquadNotification::make('task_submitted', "Ready for review: {$task->title}",
                "{$actor->name} marked this task as finished. Approve it or send it back.",
                $this->taskUrl($task), $actor, $task->project),
            $actor,
        );
    }

    public function taskApproved(Task $task, User $actor): void
    {
        $this->send(
            collect([$task->assignee])->filter(),
            SquadNotification::make('task_approved', "Approved: {$task->title}",
                "{$actor->name} approved your work. It now counts toward your contribution.",
                $this->taskUrl($task), $actor, $task->project),
            $actor,
        );
    }

    public function taskReturned(Task $task, User $actor, ?string $note = null): void
    {
        $this->send(
            collect([$task->assignee])->filter(),
            SquadNotification::make('task_returned', "Changes requested: {$task->title}",
                $note ? "{$actor->name}: “{$note}”" : "{$actor->name} sent this task back for more work.",
                $this->taskUrl($task), $actor, $task->project),
            $actor,
        );
    }

    public function taskProgress(Task $task, User $actor, ?string $note, ?int $progress): void
    {
        $what = $note ? "“{$this->short($note)}”" : "Progress is now {$progress}%.";

        // Assignee posted → tell the leader. Leader/supervisor commented → tell the assignee.
        $recipients = $task->assigned_to === $actor->id
            ? $task->project->usersWithRole('leader')
            : collect([$task->assignee])->filter();

        $this->send(
            $recipients,
            SquadNotification::make('task_update', "Update on {$task->title}", "{$actor->name}: {$what}",
                $this->taskUrl($task), $actor, $task->project),
            $actor,
        );
    }

    public function deadlineSoon(Task $task): void
    {
        $this->send(
            collect([$task->assignee])->filter(),
            SquadNotification::make('deadline', "Due tomorrow: {$task->title}",
                "This task is due on {$task->due_date->format('l, j F')}. It’s at {$task->progress}%.",
                $this->taskUrl($task), null, $task->project),
        );
    }

    private function send(Collection $users, SquadNotification $notification, ?User $actor = null): void
    {
        $users = $users->filter()->unique('id')->reject(fn (User $u) => $actor && $u->id === $actor->id);

        if ($users->isNotEmpty()) {
            Notification::send($users, $notification);
        }
    }

    private function taskUrl(Task $task): string
    {
        return "/app/projects/{$task->project_id}?tab=board&task={$task->id}";
    }

    private function short(string $text): string
    {
        return mb_strlen($text) > 90 ? mb_substr($text, 0, 87).'…' : $text;
    }
}