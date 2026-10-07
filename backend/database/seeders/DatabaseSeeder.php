<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Demo data so you can test every auth path:
     *   leader@squadboard.test / password123   (team leader)
     * Invite links are printed in the console after seeding.
     */
    public function run(): void
    {
        $leader = User::create([
            'name' => 'Demo Leader',
            'email' => 'leader@squadboard.test',
            'password' => 'password123',
            'role' => User::ROLE_STUDENT,
        ]);
        $leader->forceFill(['email_verified_at' => now()])->save();

        $project = Project::create([
            'owner_id' => $leader->id,
            'name' => 'Smart Attendance System (FYP)',
            'description' => 'Final year project — face-recognition attendance.',
            'deadline' => now()->addMonths(3),
        ]);
        $project->members()->attach($leader->id, ['role' => 'leader', 'joined_at' => now()]);

        $front = rtrim(config('squadboard.frontend_url'), '/');

        [, $newMember] = Invitation::issue($project, $leader, 'newmember@squadboard.test', 'member');
        [, $supervisor] = Invitation::issue($project, $leader, 'supervisor@squadboard.test', 'supervisor');

        $this->command->info('Leader login: leader@squadboard.test / password123');
        $this->command->info("Invite (new member signup): {$front}/invite/{$newMember}");
        $this->command->info("Invite (supervisor signup):  {$front}/invite/{$supervisor}");
    }
}
