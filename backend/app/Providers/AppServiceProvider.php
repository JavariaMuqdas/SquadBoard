<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $front = rtrim(config('squadboard.frontend_url'), '/');

        // Password reset emails link to the React page, not a Laravel view
        ResetPassword::createUrlUsing(function ($user, string $token) use ($front) {
            return "{$front}/reset-password/{$token}?email=".urlencode($user->getEmailForPasswordReset());
        });

        // Verification links still hit Laravel (signed URL); add a /api/email/verify route when you build verification
        VerifyEmail::createUrlUsing(function ($notifiable) {
            return URL::temporarySignedRoute('verification.verify', now()->addHour(), [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]);
        });
    }
}
