<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MembersTest extends TestCase
{
    use RefreshDatabase;

    private function project(): array
    {
        $leader = User::factory()->create(['role' => 'student']);
        $project = Project::create(['owner_id' => $leader->id, 'name' => 'FYP Alpha']);
        $project->members()->attach($leader->id, ['role' => 'leader', 'joined_at' => now()]);

        return [$project, $leader];
    }

    public function test_leader_invites_and_emails_are_sent(): void
    {
        Notification::fake();
        [$project, $leader] = $this->project();

        $this->actingAs($leader)->postJson("/api/projects/{$project->id}/invitations", [
            'emails' => ['ali@uni.edu', 'SARA@uni.edu', $leader->email],
            'role' => 'member',
        ])->assertCreated()
            ->assertJsonPath('sent', ['ali@uni.edu', 'sara@uni.edu'])
            ->assertJsonPath('skipped.0.reason', 'That’s you.');

        Notification::assertSentOnDemand(ProjectInvitation::class, 2);

        $this->actingAs($leader)->getJson("/api/projects/{$project->id}")->assertOk()
            ->assertJsonCount(2, 'data.invitations')
            ->assertJsonPath('data.limits.used', 3)
            ->assertJsonPath('data.permissions.manage_members', true);
    }

    public function test_member_limit_is_enforced_but_supervisors_do_not_count(): void
    {
        Notification::fake();
        [$project, $leader] = $this->project();

        $this->actingAs($leader)->postJson("/api/projects/{$project->id}/invitations", [
            'emails' => ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com'], 'role' => 'member',
        ])->assertForbidden()->assertJsonPath('reason', 'member_limit');

        $this->actingAs($leader)->postJson("/api/projects/{$project->id}/invitations", [
            'emails' => ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com'], 'role' => 'member',
        ])->assertCreated();

        $this->actingAs($leader)->postJson("/api/projects/{$project->id}/invitations", [
            'emails' => ['prof@uni.edu'], 'role' => 'supervisor',
        ])->assertCreated();
    }

    public function test_non_leader_cannot_invite_and_outsider_cannot_view(): void
    {
        [$project] = $this->project();
        $member = User::factory()->create();
        $project->members()->attach($member->id, ['role' => 'member', 'joined_at' => now()]);
        $outsider = User::factory()->create();

        $this->actingAs($member)->postJson("/api/projects/{$project->id}/invitations", ['emails' => ['z@x.com'], 'role' => 'member'])
            ->assertForbidden();
        $this->actingAs($member)->getJson("/api/projects/{$project->id}")->assertOk()
            ->assertJsonPath('data.invitations', [])->assertJsonPath('data.permissions.manage_members', false);
        $this->actingAs($outsider)->getJson("/api/projects/{$project->id}")->assertForbidden();
    }

    public function test_resend_gives_a_new_token_and_revoke_kills_it(): void
    {
        Notification::fake();
        [$project, $leader] = $this->project();
        [$invite, $oldToken] = Invitation::issue($project, $leader, 'ali@uni.edu', 'member');

        $this->actingAs($leader)->postJson("/api/projects/{$project->id}/invitations/{$invite->id}/resend")->assertOk();
        $this->assertNull(Invitation::findByToken($oldToken));

        $this->actingAs($leader)->deleteJson("/api/projects/{$project->id}/invitations/{$invite->id}")->assertOk();
        $this->assertSame('revoked', $invite->fresh()->status());
    }

    public function test_invitation_from_another_project_is_not_reachable(): void
    {
        [$project, $leader] = $this->project();
        [$other, $otherLeader] = $this->project();
        [$invite] = Invitation::issue($other, $otherLeader, 'x@y.com', 'member');

        $this->actingAs($leader)->deleteJson("/api/projects/{$project->id}/invitations/{$invite->id}")->assertNotFound();
    }

    public function test_leader_removes_member_and_member_can_leave(): void
    {
        [$project, $leader] = $this->project();
        [$a, $b] = User::factory()->count(2)->create();
        $project->members()->attach([$a->id => ['role' => 'member', 'joined_at' => now()], $b->id => ['role' => 'member', 'joined_at' => now()]]);

        $this->actingAs($leader)->deleteJson("/api/projects/{$project->id}/members/{$a->id}")->assertOk();
        $this->actingAs($b)->deleteJson("/api/projects/{$project->id}/members/{$leader->id}")->assertStatus(422);
        $this->actingAs($b)->deleteJson("/api/projects/{$project->id}/members/{$b->id}")->assertOk();

        $this->assertSame(1, $project->members()->count());
    }
}