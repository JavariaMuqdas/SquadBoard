<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Models\User;
use App\Notifications\SquadNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Fills one of YOUR projects with a demo team, tasks, history and notifications.
 *
 *   php artisan db:seed --class=DemoTeamSeeder
 *
 * Safe to run more than once — existing people and tasks are skipped.
 * Demo logins use the password: password123
 */
class DemoTeamSeeder extends Seeder
{
    private const PASSWORD = 'password123';

    private array $people = [
        'ali' => ['name' => 'Ali Khan', 'email' => 'ali.khan@squadboard.test', 'role' => 'member'],
        'sara' => ['name' => 'Sara Ahmed', 'email' => 'sara.ahmed@squadboard.test', 'role' => 'member'],
        'usman' => ['name' => 'Usman Tariq', 'email' => 'usman.tariq@squadboard.test', 'role' => 'member'],
        'fahim' => ['name' => 'Dr. Fahim Khan', 'email' => 'dr.fahim@squadboard.test', 'role' => 'supervisor'],
    ];

    public function run(): void
    {
        $project = $this->pickProject();
        if (! $project) {
            return;
        }

        $leader = $project->usersWithRole('leader')->first();
        if (! $leader) {
            $this->command->error('That project has no leader.');
            return;
        }

        DB::transaction(function () use ($project, $leader) {
            $users = $this->seedTeam($project, $leader);
            $users['leader'] = $leader;

            if ($project->tasks()->where('title', 'Project proposal & scope document')->exists()) {
                $this->command->warn('Demo tasks already exist in this project — skipped tasks and notifications.');
            } else {
                $this->seedTasks($project, $users);
                $this->seedNotifications($project, $users);
            }
        });

        $this->command->newLine();
        $this->command->info("✔ Demo team ready in “{$project->name}”. Log in as any of these (password: ".self::PASSWORD.'):');
        $this->command->table(
            ['Name', 'Email', 'Project role'],
            collect($this->people)->map(fn ($p) => [$p['name'], $p['email'], $p['role']])->values()->all()
        );
    }

    private function pickProject(): ?Project
    {
        $projects = Project::orderBy('id')->get(['id', 'name']);

        if ($projects->isEmpty()) {
            $this->command->error('No projects found. Create a project in the app first, then run this seeder.');
            return null;
        }

        if ($id = env('SEED_PROJECT_ID')) {
            return Project::find($id);
        }

        $labels = $projects->map(fn ($p) => "#{$p->id} {$p->name}")->values()->all();
        $choice = $this->command->choice('Which project should get the demo team?', $labels, 0);

        return $projects->first(fn ($p) => "#{$p->id} {$p->name}" === $choice);
    }

    /** Creates the demo accounts, an ACCEPTED invitation for each, and the project membership. */
    private function seedTeam(Project $project, User $leader): array
    {
        $users = [];
        $day = 7;

        foreach ($this->people as $key => $person) {
            $user = User::firstOrCreate(
                ['email' => $person['email']],
                [
                    'name' => $person['name'],
                    'password' => self::PASSWORD,
                    'role' => $person['role'] === 'supervisor' ? User::ROLE_SUPERVISOR : User::ROLE_STUDENT,
                ]
            );
            $user->forceFill(['email_verified_at' => $user->email_verified_at ?? now()])->save();

            $joinedAt = now()->subDays($day--)->setTime(10, 15);

            if (! $project->members()->whereKey($user->id)->exists()) {
                [$invite] = Invitation::issue($project, $leader, $person['email'], $person['role']);
                $invite->forceFill([
                    'accepted_at' => $joinedAt,
                    'created_at' => $joinedAt->copy()->subHours(5),
                    'updated_at' => $joinedAt,
                ])->save();

                $project->members()->attach($user->id, ['role' => $person['role'], 'joined_at' => $joinedAt]);
            }

            // Close any other pending invitation for this email
            Invitation::where('project_id', $project->id)->where('email', $person['email'])
                ->whereNull('accepted_at')->update(['accepted_at' => $joinedAt]);

            $users[$key] = $user;
        }

        return $users;
    }

    private function seedTasks(Project $project, array $u): void
    {
        $L = $u['leader'];
        $F = $u['fahim'];

        // [title, assignee, status, priority, effort, dueOffsetDays, progress, completedOffsetDays|null, description]
        $tasks = [
            ['Project proposal & scope document', 'leader', 'done', 'high', 3, -20, 100, -21, 'Define the problem, objectives, scope and deliverables for the proposal defence.'],
            ['Literature review on face-recognition methods', 'sara', 'done', 'medium', 5, -12, 100, -13, 'Compare at least 8 recent papers. Summarise accuracy, speed and dataset needs.'],
            ['Design database ER diagram', 'usman', 'done', 'medium', 3, -10, 100, -8, 'Students, classes, sessions and attendance records with relationships.'],
            ['Set up Laravel API & authentication', 'ali', 'done', 'high', 5, -6, 100, -7, 'Sanctum login/register, role middleware and base API structure.'],
            ['Collect & label student face dataset', 'sara', 'review', 'high', 5, 2, 100, null, 'Minimum 25 images per student across three class sections, labelled by roll number.'],
            ['Train face-recognition model (baseline)', 'ali', 'in_progress', 'urgent', 8, 6, 55, null, 'Train a baseline model on the labelled dataset and report accuracy on a held-out set.'],
            ['Build attendance dashboard UI in React', 'leader', 'in_progress', 'medium', 5, 8, 40, null, 'Attendance table, filters by class and date, and summary charts.'],
            ['Camera capture module for classrooms', 'usman', 'in_progress', 'high', 5, -1, 30, null, 'Capture frames from the classroom camera and send them to the recognition API.'],
            ['Write SRS — functional requirements', 'sara', 'todo', 'medium', 3, 10, 0, null, 'Use-cases, functional requirements and acceptance criteria (IEEE 830 style).'],
            ['Prepare mid-evaluation presentation', 'leader', 'todo', 'high', 2, 5, 0, null, '10-minute presentation: progress, demo plan and risks.'],
            ['Integration testing plan', 'usman', 'todo', 'low', 2, 14, 0, null, 'Test cases for camera → API → dashboard flow.'],
            ['Deploy demo to cloud server', null, 'todo', 'low', 3, 20, 0, null, 'Deploy API and frontend so the supervisor can try it.'],
        ];

        $positions = [];

        foreach ($tasks as $i => [$title, $who, $status, $priority, $effort, $due, $progress, $completed, $desc]) {
            $assignee = $who ? $u[$who] : null;
            $createdAt = now()->subDays(25 - $i)->setTime(9, 30);

            $task = new Task();
            $task->forceFill([
                'project_id' => $project->id,
                'title' => $title,
                'description' => $desc,
                'status' => $status,
                'priority' => $priority,
                'effort' => $effort,
                'assigned_to' => $assignee?->id,
                'created_by' => $L->id,
                'due_date' => now()->addDays($due)->toDateString(),
                'progress' => $progress,
                'position' => $positions[$status] = ($positions[$status] ?? -1) + 1,
                'submitted_at' => in_array($status, ['review', 'done']) ? $this->at($completed ?? -1, 16) : null,
                'completed_at' => $status === 'done' ? $this->at($completed, 18) : null,
                'approved_by' => $status === 'done' ? ($i % 2 ? $F->id : $L->id) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ])->save();

            $this->log($task, $L, 'created', $createdAt, ['new_status' => 'todo']);

            if (! $assignee || $status === 'todo') {
                continue;
            }

            $startedAt = $createdAt->copy()->addDays(1)->setTime(11, 0);
            $this->log($task, $assignee, 'status', $startedAt, ['old_status' => 'todo', 'new_status' => 'in_progress', 'progress' => 10]);
            $this->log($task, $assignee, 'progress', $startedAt->copy()->addDays(2), ['progress' => min($progress, 50)]);

            if (in_array($status, ['review', 'done'])) {
                $this->log($task, $assignee, 'submitted', $task->submitted_at, ['old_status' => 'in_progress', 'new_status' => 'review', 'progress' => 100]);
            }
            if ($status === 'done') {
                $approver = $i % 2 ? $F : $L;
                $this->log($task, $approver, 'approved', $task->completed_at, ['old_status' => 'review', 'new_status' => 'done', 'progress' => 100]);
            }
        }

        // A few realistic notes
        $byTitle = $project->tasks()->pluck('id', 'title');
        $notes = [
            ['Set up Laravel API & authentication', 'ali', -8, 'Sanctum login and register endpoints are working, with feature tests for both.', null],
            ['Literature review on face-recognition methods', 'fahim', -12, 'Good coverage. Please add a table comparing accuracy against processing speed.', null],
            ['Collect & label student face dataset', 'sara', -1, 'Collected 1,200 labelled images from three sections. Shared folder linked below.', 'https://example.com/demo-dataset'],
            ['Train face-recognition model (baseline)', 'ali', 0, 'Baseline model reaches 87% accuracy on 40 students. Tuning the threshold next.', null],
            ['Camera capture module for classrooms', 'usman', -1, 'Webcam capture works on a laptop; testing with the classroom IP camera this week.', null],
            ['Build attendance dashboard UI in React', 'leader', -2, 'Attendance table and filters are done. Charts are in progress.', null],
        ];

        foreach ($notes as [$title, $who, $day, $note, $proof]) {
            $task = Task::find($byTitle[$title]);
            $this->log($task, $u[$who], 'note', $this->at($day, 14), ['note' => $note, 'proof_url' => $proof, 'progress' => $task->progress]);
        }
    }

    private function seedNotifications(Project $project, array $u): void
    {
        $L = $u['leader'];
        $taskUrl = fn (string $title) => "/app/projects/{$project->id}?tab=board&task=".$project->tasks()->where('title', $title)->value('id');

        $forLeader = [
            ['task_update', 'Update on Train face-recognition model (baseline)', 'Ali Khan: “Baseline model reaches 87% accuracy on 40 students. Tuning the threshold next.”', $taskUrl('Train face-recognition model (baseline)'), $u['ali'], 50, null],
            ['task_submitted', 'Ready for review: Collect & label student face dataset', 'Sara Ahmed marked this task as finished. Approve it or send it back.', $taskUrl('Collect & label student face dataset'), $u['sara'], 180, null],
            ['task_update', 'Update on Camera capture module for classrooms', 'Usman Tariq: “Webcam capture works on a laptop; testing with the classroom IP camera this week.”', $taskUrl('Camera capture module for classrooms'), $u['usman'], 60 * 20, null],
            ['member_joined', "Usman Tariq joined {$project->name}", 'They accepted your invitation and joined as team member.', "/app/projects/{$project->id}?tab=members", $u['usman'], 60 * 24 * 5, true],
            ['member_joined', "Dr. Fahim Khan joined {$project->name}", 'They accepted your invitation and joined as supervisor.', "/app/projects/{$project->id}?tab=members", $u['fahim'], 60 * 24 * 4, true],
        ];

        foreach ($forLeader as [$kind, $title, $body, $url, $actor, $minutesAgo, $read]) {
            $this->notify($L, SquadNotification::make($kind, $title, $body, $url, $actor, $project), $minutesAgo, $read);
        }

        $this->notify($u['ali'], SquadNotification::make('task_assigned', 'New task: Train face-recognition model (baseline)',
            "{$L->name} assigned this task to you. Due ".now()->addDays(6)->format('j M').'.',
            $taskUrl('Train face-recognition model (baseline)'), $L, $project), 60 * 24 * 3);
        $this->notify($u['sara'], SquadNotification::make('task_approved', 'Approved: Literature review on face-recognition methods',
            'Dr. Fahim Khan approved your work. It now counts toward your contribution.',
            $taskUrl('Literature review on face-recognition methods'), $u['fahim'], $project), 60 * 24 * 13);
        $this->notify($u['fahim'], SquadNotification::make('task_submitted', 'Ready for review: Collect & label student face dataset',
            'Sara Ahmed marked this task as finished. Approve it or send it back.',
            $taskUrl('Collect & label student face dataset'), $u['sara'], $project), 180);
    }

    private function notify(User $user, SquadNotification $notification, int $minutesAgo, ?bool $read = false): void
    {
        $at = now()->subMinutes($minutesAgo);

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => SquadNotification::class,
            'notifiable_type' => $user->getMorphClass(),
            'notifiable_id' => $user->id,
            'data' => json_encode($notification->payload),
            'read_at' => $read ? $at : null,
            'created_at' => $at,
            'updated_at' => $at,
        ]);
    }

    private function log(Task $task, User $user, string $type, Carbon $at, array $attributes = []): void
    {
        TaskUpdate::create([
            'task_id' => $task->id,
            'project_id' => $task->project_id,
            'user_id' => $user->id,
            'type' => $type,
            'created_at' => $at,
            ...$attributes,
        ]);
    }

    private function at(int $dayOffset, int $hour): Carbon
    {
        return now()->addDays($dayOffset)->setTime($hour, 0)->min(now());
    }
}