<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Notifications\SquadNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_read_one_and_read_all(): void
    {
        $user = User::factory()->create();
        $project = Project::create(['owner_id' => $user->id, 'name' => 'FYP']);

        foreach (range(1, 3) as $i) {
            $user->notify(SquadNotification::make('task_update', "Update {$i}", 'Body', '/app', null, $project));
        }

        $list = $this->actingAs($user)->getJson('/api/notifications')->assertOk()
            ->assertJsonCount(3, 'data')->assertJsonPath('unread_count', 3)
            ->assertJsonPath('data.0.kind', 'task_update')
            ->assertJsonPath('data.0.project.name', 'FYP');

        $id = $list->json('data.0.id');
        $this->actingAs($user)->postJson("/api/notifications/{$id}/read")->assertOk()->assertJsonPath('unread_count', 2);
        $this->actingAs($user)->getJson('/api/notifications?filter=unread')->assertJsonCount(2, 'data');

        $this->actingAs($user)->postJson('/api/notifications/read-all')->assertOk()->assertJsonPath('unread_count', 0);
    }

    public function test_cannot_read_someone_elses_notification(): void
    {
        [$a, $b] = User::factory()->count(2)->create();
        $a->notify(SquadNotification::make('task_update', 'Private', 'Body'));
        $id = $a->notifications()->first()->id;

        $this->actingAs($b)->postJson("/api/notifications/{$id}/read")->assertNotFound();
    }

    public function test_project_settings_archive_and_delete(): void
    {
        $leader = User::factory()->create(['role' => 'student']);
        $member = User::factory()->create();
        $project = Project::create(['owner_id' => $leader->id, 'name' => 'Old name']);
        $project->members()->attach([
            $leader->id => ['role' => 'leader', 'joined_at' => now()],
            $member->id => ['role' => 'member', 'joined_at' => now()],
        ]);

        $this->actingAs($member)->putJson("/api/projects/{$project->id}", ['name' => 'Hacked'])->assertForbidden();
        $this->actingAs($leader)->putJson("/api/projects/{$project->id}", ['name' => 'New name', 'color' => 'rose'])
            ->assertOk()->assertJsonPath('data.name', 'New name');

        $this->actingAs($leader)->postJson("/api/projects/{$project->id}/archive")->assertJsonPath('status', 'archived');
        $this->actingAs($leader)->getJson('/api/projects')->assertJsonCount(0, 'data');
        $this->actingAs($leader)->getJson('/api/projects?status=archived')->assertJsonCount(1, 'data');

        $this->actingAs($leader)->deleteJson("/api/projects/{$project->id}", ['confirm' => 'wrong'])->assertStatus(422);
        $this->actingAs($leader)->deleteJson("/api/projects/{$project->id}", ['confirm' => 'New name'])->assertOk();
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_profile_name_and_password(): void
    {
        $user = User::factory()->create(['password' => 'oldpass123']);

        $this->actingAs($user)->putJson('/api/user', ['name' => 'New Name'])->assertOk()->assertJsonPath('data.name', 'New Name');

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'wrong', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'oldpass123', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk();
    }
}