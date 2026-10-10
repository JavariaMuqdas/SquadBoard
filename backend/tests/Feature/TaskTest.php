<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;
    private User $leader;
    private User $member;
    private User $supervisor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->leader = User::factory()->create(['role' => 'student']);
        $this->member = User::factory()->create(['role' => 'student']);
        $this->supervisor = User::factory()->create(['role' => 'supervisor']);

        $this->project = Project::create(['owner_id' => $this->leader->id, 'name' => 'FYP Alpha']);
        $this->project->members()->attach([
            $this->leader->id => ['role' => 'leader', 'joined_at' => now()],
            $this->member->id => ['role' => 'member', 'joined_at' => now()],
            $this->supervisor->id => ['role' => 'supervisor', 'joined_at' => now()],
        ]);
    }

    private function createTask(array $data = []): Task
    {
        $id = $this->actingAs($this->leader)->postJson("/api/projects/{$this->project->id}/tasks", [
            'title' => 'Build login API',
            'effort' => 5,
            'assigned_to' => $this->member->id,
            ...$data,
        ])->assertCreated()->json('data.id');

        return Task::findOrFail($id);
    }

    public function test_leader_creates_task_and_assignee_is_notified(): void
    {
        $task = $this->createTask();

        $this->assertSame('todo', $task->status);
        $this->assertDatabaseHas('task_updates', ['task_id' => $task->id, 'type' => 'created']);
        $this->assertSame('task_assigned', $this->member->notifications()->first()->data['kind']);

        $this->actingAs($this->member)->getJson("/api/projects/{$this->project->id}/tasks")
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('permissions.manage_tasks', false);
    }

    public function test_member_cannot_create_tasks_or_assign_supervisor(): void
    {
        $this->actingAs($this->member)->postJson("/api/projects/{$this->project->id}/tasks", ['title' => 'Sneaky'])
            ->assertForbidden();

        $this->actingAs($this->leader)->postJson("/api/projects/{$this->project->id}/tasks", [
            'title' => 'Wrong person', 'assigned_to' => $this->supervisor->id,
        ])->assertStatus(422)->assertJsonValidationErrors('assigned_to');
    }

    public function test_member_submits_for_review_and_cannot_mark_done(): void
    {
        $task = $this->createTask();

        $this->actingAs($this->member)->patchJson("/api/tasks/{$task->id}/move", ['status' => 'done'])
            ->assertForbidden();

        $this->actingAs($this->member)->patchJson("/api/tasks/{$task->id}/move", ['status' => 'review'])
            ->assertOk()->assertJsonPath('data.status', 'review')->assertJsonPath('data.progress', 100);

        // Leader and supervisor both hear about it
        $this->assertSame('task_submitted', $this->leader->notifications()->first()->data['kind']);
        $this->assertSame('task_submitted', $this->supervisor->notifications()->first()->data['kind']);
    }

    public function test_supervisor_approves_and_can_send_back(): void
    {
        $task = $this->createTask();
        $this->actingAs($this->member)->patchJson("/api/tasks/{$task->id}/move", ['status' => 'review']);

        $this->actingAs($this->supervisor)->patchJson("/api/tasks/{$task->id}/move", [
            'status' => 'in_progress', 'note' => 'Please add tests.',
        ])->assertOk();
        $this->assertDatabaseHas('task_updates', ['task_id' => $task->id, 'type' => 'returned', 'note' => 'Please add tests.']);

        $this->actingAs($this->supervisor)->patchJson("/api/tasks/{$task->id}/move", ['status' => 'done'])->assertOk();
        $task->refresh();
        $this->assertNotNull($task->completed_at);
        $this->assertSame($this->supervisor->id, $task->approved_by);
        $this->assertContains('task_approved', $this->member->notifications()->get()->pluck('data.kind'));

        // Approved work can't be reopened by the member
        $this->actingAs($this->member)->patchJson("/api/tasks/{$task->id}/move", ['status' => 'in_progress'])->assertForbidden();
    }

    public function test_other_members_cannot_touch_someone_elses_task(): void
    {
        $task = $this->createTask();
        $other = User::factory()->create();
        $this->project->members()->attach($other->id, ['role' => 'member', 'joined_at' => now()]);

        $this->actingAs($other)->patchJson("/api/tasks/{$task->id}/move", ['status' => 'in_progress'])->assertForbidden();
        $this->actingAs($other)->postJson("/api/tasks/{$task->id}/updates", ['note' => 'hi'])->assertForbidden();
    }

    public function test_progress_update_moves_todo_to_in_progress_and_logs_it(): void
    {
        $task = $this->createTask();

        $this->actingAs($this->member)->postJson("/api/tasks/{$task->id}/updates", [
            'progress' => 40, 'note' => 'Login done, register next.', 'proof_url' => 'https://github.com/x/y/pull/1',
        ])->assertOk()->assertJsonPath('data.status', 'in_progress')->assertJsonPath('data.progress', 40);

        $this->actingAs($this->member)->getJson("/api/tasks/{$task->id}")->assertOk()
            ->assertJsonPath('data.updates.0.note', 'Login done, register next.')
            ->assertJsonPath('data.updates.0.proof_url', 'https://github.com/x/y/pull/1');

        $this->assertSame('task_update', $this->leader->notifications()->first()->data['kind']);
    }

    public function test_drag_reorders_positions_inside_a_column(): void
    {
        $a = $this->createTask(['title' => 'Task A']);
        $b = $this->createTask(['title' => 'Task B']);
        $c = $this->createTask(['title' => 'Task C']);

        $this->actingAs($this->leader)->patchJson("/api/tasks/{$c->id}/move", ['status' => 'todo', 'position' => 0])->assertOk();

        $this->assertSame(
            [$c->id, $a->id, $b->id],
            Task::where('status', 'todo')->orderBy('position')->pluck('id')->all()
        );
    }

    public function test_my_tasks_and_report(): void
    {
        $t1 = $this->createTask(['title' => 'Done one', 'effort' => 5]);
        $this->createTask(['title' => 'Open one', 'effort' => 3]);
        $this->actingAs($this->leader)->patchJson("/api/tasks/{$t1->id}/move", ['status' => 'done']);

        $this->actingAs($this->member)->getJson('/api/my-tasks')->assertOk()
            ->assertJsonPath('counts.all', 2)->assertJsonPath('counts.done', 1);

        $report = $this->actingAs($this->supervisor)->getJson("/api/projects/{$this->project->id}/report")->assertOk();
        $report->assertJsonPath('totals.tasks', 2)->assertJsonPath('totals.points_done', 5);

        $memberRow = collect($report->json('members'))->firstWhere('id', $this->member->id);
        $this->assertEquals(100, $memberRow['share']);
        $this->assertSame(1, $memberRow['tasks_done']);
    }

    public function test_removing_a_member_unassigns_open_tasks(): void
    {
        $task = $this->createTask();

        $this->actingAs($this->leader)->deleteJson("/api/projects/{$this->project->id}/members/{$this->member->id}")->assertOk();

        $this->assertNull($task->fresh()->assigned_to);
        $this->assertContains('removed', $this->member->notifications()->get()->pluck('data.kind'));
    }
}