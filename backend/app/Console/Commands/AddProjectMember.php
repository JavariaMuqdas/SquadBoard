<?php

namespace App\Console\Commands;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Adds someone to a project directly, without the invite link.
 * Useful while the app only runs on localhost.
 *
 *   php artisan squadboard:add-member prof@uni.edu --role=supervisor
 *   php artisan squadboard:add-member ali@uni.edu --project=1 --name="Ali Khan" --password=secret123
 */
class AddProjectMember extends Command
{
    protected $signature = 'squadboard:add-member
                            {email : Email of the person to add}
                            {--project= : Project ID (you will be asked if omitted)}
                            {--role=member : member or supervisor}
                            {--name= : Full name (used only when creating a new account)}
                            {--password= : Password for a new account (you will be asked if omitted)}
                            {--force : Ignore the free-plan member limit}';

    protected $description = 'Add a member or supervisor to a project directly (creates the account if needed)';

    public function handle(Notifier $notifier): int
    {
        $email = mb_strtolower(trim($this->argument('email')));
        $role = $this->option('role');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error("“{$email}” is not a valid email address.");
            return self::FAILURE;
        }
        if (! in_array($role, ['member', 'supervisor'], true)) {
            $this->error('--role must be "member" or "supervisor".');
            return self::FAILURE;
        }

        $project = $this->resolveProject();
        if (! $project) {
            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();
        $created = false;
        $plainPassword = null;

        if ($user && $user->roleIn($project)) {
            $this->warn("{$user->name} <{$email}> is already in “{$project->name}” as {$user->roleIn($project)}.");
            return self::SUCCESS;
        }

        // Free plan: leader + members can't exceed the limit (supervisors don't count)
        if ($role === 'member' && ! $this->option('force')) {
            $max = config('squadboard.free.max_members', 5);
            $count = $project->members()->wherePivotIn('role', ['leader', 'member'])->count();
            if ($count >= $max) {
                $this->error("“{$project->name}” already has {$count}/{$max} people (free plan). Use --force to add anyway.");
                return self::FAILURE;
            }
        }

        if (! $user) {
            $name = $this->option('name') ?: $this->ask('Full name for the new account', ucwords(str_replace(['.', '_'], ' ', strtok($email, '@'))));
            $plainPassword = $this->option('password') ?: $this->secret('Password for the new account (min 8 characters)');

            if (strlen((string) $plainPassword) < 8) {
                $this->error('Password must be at least 8 characters.');
                return self::FAILURE;
            }

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => $plainPassword,
                'role' => $role === 'supervisor' ? User::ROLE_SUPERVISOR : User::ROLE_STUDENT,
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
            $created = true;
        }

        DB::transaction(function () use ($project, $user, $role, $email) {
            $project->members()->attach($user->id, ['role' => $role, 'joined_at' => now()]);

            // Close any pending invitation for this email so it disappears from "Pending invitations"
            Invitation::where('project_id', $project->id)
                ->where('email', $email)
                ->whereNull('accepted_at')
                ->update(['accepted_at' => now()]);
        });

        // Same in-app notification the leader gets when someone accepts an invite
        $notifier->memberJoined($project, $user, $role);

        $this->newLine();
        $this->info("✔ {$user->name} added to “{$project->name}” as {$role}.");
        $this->table(['Field', 'Value'], array_filter([
            ['Project', "#{$project->id} {$project->name}"],
            ['Name', $user->name],
            ['Email', $user->email],
            ['Project role', $role],
            ['Account', $created ? 'New account created' : 'Existing account'],
            $created ? ['Password', $plainPassword] : null,
        ]));

        if ($created) {
            $this->line('They can log in at '.rtrim(config('squadboard.frontend_url'), '/').'/login');
        }

        return self::SUCCESS;
    }

    private function resolveProject(): ?Project
    {
        if ($id = $this->option('project')) {
            $project = Project::find($id);
            if (! $project) {
                $this->error("No project with ID {$id}.");
            }
            return $project;
        }

        $projects = Project::where('status', 'active')->orderBy('id')->get(['id', 'name']);
        if ($projects->isEmpty()) {
            $this->error('There are no projects yet. Create one in the app first.');
            return null;
        }

        $choice = $this->choice(
            'Which project?',
            $projects->mapWithKeys(fn ($p) => [$p->id => "#{$p->id} {$p->name}"])->all()
        );

        return $projects->firstWhere('id', (int) $choice)
            ?? $projects->first(fn ($p) => "#{$p->id} {$p->name}" === $choice);
    }
}