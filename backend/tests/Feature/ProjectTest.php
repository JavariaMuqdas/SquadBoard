<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_creates_project_and_becomes_leader(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $this->actingAs($user)->postJson('/api/projects', [
            'name' => 'Smart Attendance System',
            'course' => 'FYP',
            'deadline' => now()->addMonth()->toDateString(),
            'color' => 'violet',
        ])->assertCreated()
            ->assertJsonPath('data.my_role', 'leader')
            ->assertJsonPath('data.members_count', 1);

        $this->actingAs($user)->getJson('/api/projects')->assertOk()->assertJsonCount(1, 'data');
        $this->actingAs($user)->getJson('/api/dashboard')->assertOk()
            ->assertJsonPath('stats.projects', 1)->assertJsonPath('stats.leading', 1);
    }

    public function test_supervisor_cannot_create_project(): void
    {
        $sup = User::factory()->create(['role' => 'supervisor']);
        $this->actingAs($sup)->postJson('/api/projects', ['name' => 'Nope'])->assertForbidden();
    }

    public function test_validation_and_free_plan_limit(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $this->actingAs($user)->postJson('/api/projects', ['name' => 'ab', 'deadline' => '2000-01-01'])
            ->assertStatus(422)->assertJsonValidationErrors(['name', 'deadline']);

        foreach (range(1, 3) as $i) {
            $this->actingAs($user)->postJson('/api/projects', ['name' => "Project {$i}"])->assertCreated();
        }
        $this->actingAs($user)->postJson('/api/projects', ['name' => 'Project 4'])
            ->assertForbidden()->assertJsonPath('reason', 'plan_limit');
    }
}