<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Invitation extends Model
{
    protected $fillable = ['project_id', 'invited_by', 'email', 'role', 'token_hash', 'expires_at'];

    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function setEmailAttribute(string $value): void
    {
        $this->attributes['email'] = mb_strtolower(trim($value));
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /** Creates an invitation and returns [invitation, plainToken]. The plain token goes in the email link only. */
    public static function issue(Project $project, User $inviter, string $email, string $role): array
    {
        $plain = Str::random(48);

        $invitation = static::create([
            'project_id' => $project->id,
            'invited_by' => $inviter->id,
            'email' => $email,
            'role' => $role,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDays(config('squadboard.invite_expiry_days', 7)),
        ]);

        return [$invitation, $plain];
    }
    
        /** New token + fresh expiry (used by "Resend"). Returns the plain token. */
    public function refreshToken(): string
    {
        $plain = Str::random(48);

        $this->forceFill([
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDays(config('squadboard.invite_expiry_days', 7)),
            'revoked_at' => null,
        ])->save();

        return $plain;
    }

    public static function findByToken(?string $plain): ?self
    {
        if (! $plain) {
            return null;
        }

        return static::with(['project', 'inviter'])
            ->where('token_hash', hash('sha256', $plain))
            ->first();
    }

    /** 'pending' | 'accepted' | 'expired' | 'revoked' */
    public function status(): string
    {
        return match (true) {
            $this->revoked_at !== null => 'revoked',
            $this->accepted_at !== null => 'accepted',
            $this->expires_at->isPast() => 'expired',
            default => 'pending',
        };
    }

    public function isUsable(): bool
    {
        return $this->status() === 'pending';
    }

    public function matchesEmail(string $email): bool
    {
        return $this->email === mb_strtolower(trim($email));
    }
}
