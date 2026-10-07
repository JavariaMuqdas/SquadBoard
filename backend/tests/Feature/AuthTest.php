<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Make Sanctum treat test requests as coming from the React SPA (session-based)
        config(['sanctum.stateful' => ['localhost:5173']]);
        $this->withHeaders(['Referer' => 'http://localhost:5173', 'Origin' => 'http://localhost:5173']);
    }

    private function projectWithInvite(string $email, string $role = 'member', bool $expired = false): array
    {
        $leader = User::factory()->create();
        $project = Project::create(['owner_id' => $leader->id, 'name' => 'FYP Alpha']);
        $project->members()->attach($leader->id, ['role' => 'leader', 'joined_at' => now()]);

        [$invite, $token] = Invitation::issue($project, $leader, $email, $role);
        if ($expired) {
            $invite->forceFill(['expires_at' => now()->subDay()])->save();
        }

        return [$project, $invite, $token];
    }

    private function signup(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/register', array_merge([
            'name' => 'Ali Khan',
            'email' => 'ali@uni.edu',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'student',
            'terms' => true,
        ], $overrides));
    }

    public function test_user_can_register_and_is_logged_in(): void
    {
        $this->signup()->assertCreated()->assertJsonPath('user.email', 'ali@uni.edu');

        $this->assertAuthenticated();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('data.role', 'student');
    }

    public function test_email_is_unique_case_insensitively(): void
    {
        User::factory()->create(['email' => 'ali@uni.edu']);

        $this->signup(['email' => 'ALI@Uni.edu'])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_user_can_login_and_logout(): void
    {
        User::factory()->create(['email' => 'sara@uni.edu', 'password' => 'secret123']);

        $this->postJson('/api/login', ['email' => 'sara@uni.edu', 'password' => 'secret123'])->assertOk();
        $this->assertAuthenticated();

        $this->postJson('/api/logout')->assertOk();
        $this->assertGuest('web');
    }

    public function test_wrong_password_is_rejected(): void
    {
        User::factory()->create(['email' => 'sara@uni.edu', 'password' => 'secret123']);

        $this->postJson('/api/login', ['email' => 'sara@uni.edu', 'password' => 'nope'])
            ->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_guest_cannot_read_current_user(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_invited_person_signs_up_and_joins_project(): void
    {
        [$project, $invite, $token] = $this->projectWithInvite('new@uni.edu', 'supervisor');

        $this->signup(['email' => 'new@uni.edu', 'role' => 'student', 'invite_token' => $token])
            ->assertCreated()
            ->assertJsonPath('joined_project.name', 'FYP Alpha')
            ->assertJsonPath('user.role', 'supervisor')   // forced from the invite
            ->assertJsonPath('user.email_verified', true);

        $user = User::where('email', 'new@uni.edu')->first();
        $this->assertSame('supervisor', $user->roleIn($project));
        $this->assertNotNull($invite->fresh()->accepted_at);
    }

    public function test_invite_signup_with_a_different_email_is_blocked(): void
    {
        [, , $token] = $this->projectWithInvite('new@uni.edu');

        $this->signup(['email' => 'someone-else@uni.edu', 'invite_token' => $token])
            ->assertForbidden()->assertJsonPath('reason', 'email_mismatch');

        $this->assertDatabaseMissing('users', ['email' => 'someone-else@uni.edu']);
    }

    public function test_existing_user_joins_by_logging_in_with_invite(): void
    {
        $user = User::factory()->create(['email' => 'old@uni.edu', 'password' => 'secret123']);
        [$project, , $token] = $this->projectWithInvite('old@uni.edu');

        $this->postJson('/api/login', ['email' => 'old@uni.edu', 'password' => 'secret123', 'invite_token' => $token])
            ->assertOk()->assertJsonPath('joined_project.name', 'FYP Alpha');

        $this->assertSame('member', $user->roleIn($project));
    }

    public function test_login_with_someone_elses_invite_still_logs_in_but_reports_error(): void
    {
        User::factory()->create(['email' => 'old@uni.edu', 'password' => 'secret123']);
        [, , $token] = $this->projectWithInvite('other@uni.edu');

        $this->postJson('/api/login', ['email' => 'old@uni.edu', 'password' => 'secret123', 'invite_token' => $token])
            ->assertOk()
            ->assertJsonPath('joined_project', null)
            ->assertJsonPath('invite_error.reason', 'email_mismatch');
    }

    public function test_invite_preview_and_expiry(): void
    {
        User::factory()->create(['email' => 'old@uni.edu']);
        [, , $token] = $this->projectWithInvite('old@uni.edu');
        [, , $expired] = $this->projectWithInvite('late@uni.edu', 'member', expired: true);

        $this->getJson("/api/invitations/{$token}")
            ->assertOk()->assertJsonPath('status', 'pending')->assertJsonPath('account_exists', true);

        $this->getJson("/api/invitations/{$expired}")->assertOk()->assertJsonPath('status', 'expired');
        $this->getJson('/api/invitations/not-a-real-token')->assertNotFound();
    }

    public function test_invite_cannot_be_used_twice(): void
    {
        $user = User::factory()->create(['email' => 'old@uni.edu']);
        [, , $token] = $this->projectWithInvite('old@uni.edu');

        $this->actingAs($user)->postJson("/api/invitations/{$token}/accept")->assertOk();
        $this->actingAs($user)->postJson("/api/invitations/{$token}/accept")
            ->assertStatus(410)->assertJsonPath('reason', 'accepted');
    }
}
