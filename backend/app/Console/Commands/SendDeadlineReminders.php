<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Services\Notifier;
use Illuminate\Console\Command;

/** Runs daily (see routes/console.php). Tells each assignee about tasks due tomorrow. */
class SendDeadlineReminders extends Command
{
    protected $signature = 'squadboard:deadline-reminders';

    protected $description = 'Notify assignees about unfinished tasks due tomorrow';

    public function handle(Notifier $notifier): int
    {
        $tasks = Task::with(['assignee', 'project'])
            ->whereNotNull('assigned_to')
            ->where('status', '!=', 'done')
            ->whereDate('due_date', today()->addDay())
            ->whereHas('project', fn ($q) => $q->where('status', 'active'))
            ->get();

        $tasks->each(fn (Task $task) => $notifier->deadlineSoon($task));

        $this->info("Sent {$tasks->count()} deadline reminder(s).");

        return self::SUCCESS;
    }
}