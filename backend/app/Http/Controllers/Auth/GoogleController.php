<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\InvitationException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleController extends Controller
{
    /** /oauth/google/redirect?role=student|supervisor&invite=TOKEN&mode=login|register */
    public function redirect(Request $request): RedirectResponse
    {
        $request->session()->put('oauth', [
            'role' => in_array($request->query('role'), ['student', 'supervisor'], true) ? $request->query('role') : 'student',
            'invite' => $request->query('invite'),
        ]);

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request, InvitationService $invites): RedirectResponse
    {
        $front = rtrim(config('squadboard.frontend_url'), '/');
        $oauth = $request->session()->pull('oauth', ['role' => 'student', 'invite' => null]);

        try {
            $google = Socialite::driver('google')->user();
        } catch (Throwable) {
            return redirect("{$front}/login?error=google_failed");
        }

        $email = mb_strtolower($google->getEmail());

        // One email = one account: link Google to an existing account instead of creating a duplicate
        $user = User::where('google_id', $google->getId())->first()
            ?? User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $user->google_id ?? $google->getId(),
                'avatar' => $user->avatar ?? $google->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        } else {
            $user = User::create([
                'name' => $google->getName() ?: strtok($email, '@'),
                'email' => $email,
                'role' => $oauth['role'],
                'google_id' => $google->getId(),
                'avatar' => $google->getAvatar(),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        if (! empty($oauth['invite'])) {
            try {
                $invitation = $invites->resolve($oauth['invite']);
                $project = $invites->accept($invitation, $user);

                return redirect("{$front}/app?joined=".urlencode($project->name));
            } catch (InvitationException $e) {
                return redirect("{$front}/app?invite_error=".$e->reason);
            }
        }

        return redirect("{$front}/app");
    }
}
