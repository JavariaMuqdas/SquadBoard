<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;


/**
 * All task rules in one place:
 * - Leader & supervisor ("managers") can do anything.
 * - The assignee can move their own task between To do, In progress and Review, and post progress.
 * - Only managers can mark a task Done (approval) or reopen a Done task.
 */
class TaskService
{
    public function __construct(private Notifier $notifier)
    {
    }

    public function isManager(User $user, Project $project): bool
    {
        return in_array($user->roleIn($project), ['leader', 'supervisor'], true);
    }

    public function create(Project $project, User $actor, array $data): Task
    {
        $status = $data['status'] ?? 'todo';

        $task = DB::transaction(function () use ($project, $actor, $data, $status) {
            $task = $project->tasks()->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'status' => $status,
                'priority' => $data['priority'] ?? 'medium',
                'effort' => $data['effort'] ?? 1,
                'assigned_to' => $data['assigned_to'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'created_by' => $actor->id,
                'position' => (int) $project->tasks()->where('status', $status)->max('position') + 1,
            ]);

            if ($status === 'done') {
                $task->forceFill(['completed_at' => now(), 'progress' => 100, 'approved_by' => $actor->id])->save();
            }

            $task->logUpdate($actor, 'created', ['new_status' => $status]);

            return $task;
        });

        $task->load('assignee', 'project');
        $this->notifier->taskAssigned($task, $actor);

        return $task;
    }

    public function update(Task $task, User $actor, array $data): Task
    {
        $oldAssignee = $task->assigned_to;
        $assigneeChanged = array_key_exists('assigned_to', $data)
            && (int) ($data['assigned_to'] ?? 0) !== (int) ($oldAssignee ?? 0);
        $newStatus = $data['status'] ?? null;
        unset($data['status']);

        DB::transaction(function () use ($task, $actor, $data, $assigneeChanged) {
            $task->fill($data)->save();

            if ($assigneeChanged) {
                $task->logUpdate($actor, 'assigned');
            } elseif ($task->wasChanged()) {
                $task->logUpdate($actor, 'edited');
            }
        });

        $task->load('assignee', 'project');

        if ($assigneeChanged && $task->assigned_to) {
            $this->notifier->taskAssigned($task, $actor);
        }

        if ($newStatus && $newStatus !== $task->status) {
            $this->move($task, $actor, $newStatus);
        }

        return $task;
    }

    public function move(Task $task, User $actor, string $to, ?int $position = null, ?string $note = null): Task
    {
        $from = $task->status;
        $manager = $this->isManager($actor, $task->project);

        if (! $manager && $from !== $to) {
            if ($to === 'done') {
                $this->deny('Only the team leader or supervisor can mark a task as done. Move it to Review and they’ll approve it.');
            }
            if ($from === 'done') {
                $this->deny('This task has already been approved. Ask your team leader to reopen it.');
            }
        }

        $type = match (true) {
            $from === $to => null,
            $to === 'review' => 'submitted',
            $to === 'done' => 'approved',
            $from === 'review' && $manager && $task->assigned_to !== $actor->id => 'returned',
            default => 'status',
        };

        DB::transaction(function () use ($task, $actor, $from, $to, $type, $position, $note) {
            if ($type) {
                $task->status = $to;

                if ($to === 'done') {
                    $task->completed_at = now();
                    $task->approved_by = $actor->id;
                    $task->progress = 100;
                } elseif ($from === 'done') {
                    $task->completed_at = null;
                    $task->approved_by = null;
                }

                if ($to === 'review') {
                    $task->submitted_at = now();
                    $task->progress = 100;
                }

                if ($to === 'in_progress' && $from === 'todo' && $task->progress === 0) {
                    $task->progress = 10;
                }

                $task->save();
                $task->logUpdate($actor, $type, [
                    'old_status' => $from,
                    'new_status' => $to,
                    'note' => $note,
                    'progress' => $task->progress,
                ]);
            }

            $this->reposition($task, $position);
        });

        match ($type) {
            'submitted' => $this->notifier->taskSubmitted($task, $actor),
            'approved' => $this->notifier->taskApproved($task, $actor),
            'returned' => $this->notifier->taskReturned($task, $actor, $note),
            default => null,
        };

        return $task->fresh(['assignee', 'project']);
    }

    public function addUpdate(Task $task, User $actor, ?string $note, ?int $progress, ?string $proofUrl): Task
    {
        $manager = $this->isManager($actor, $task->project);

        if ($task->status === 'done' && $progress !== null && ! $manager) {
            $this->deny('This task is already approved, so its progress can’t be changed.');
        }

        DB::transaction(function () use ($task, $actor, $note, $progress, $proofUrl) {
            if ($progress !== null) {
                $task->progress = $progress;
                if ($task->status === 'todo' && $progress > 0) {
                    $task->status = 'in_progress';
                }
                $task->save();
            }

            $task->logUpdate($actor, $note ? 'note' : 'progress', [
                'note' => $note,
                'progress' => $progress,
                'proof_url' => $proofUrl,
            ]);
        });

        $task->load('assignee', 'project');
        $this->notifier->taskProgress($task, $actor, $note, $progress);

        return $task;
    }

    /** Puts the task at $position inside its column and renumbers the rest. */
    private function reposition(Task $task, ?int $position): void
    {
        $ids = Task::where('project_id', $task->project_id)
            ->where('status', $task->status)
            ->whereKeyNot($task->id)
            ->orderBy('position')->orderBy('id')
            ->pluck('id')->all();

        $index = $position === null ? count($ids) : max(0, min($position, count($ids)));
        array_splice($ids, $index, 0, [$task->id]);

        foreach ($ids as $i => $id) {
            Task::whereKey($id)->where('position', '!=', $i)->update(['position' => $i]);
        }
    }

    private function deny(string $message): never
    {
        throw new HttpResponseException(response()->json(['message' => $message], 403));
    }
}
