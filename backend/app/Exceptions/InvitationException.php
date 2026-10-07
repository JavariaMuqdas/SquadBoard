<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class InvitationException extends Exception
{
    public function __construct(public readonly string $reason, string $message, public readonly int $status = 422)
    {
        parent::__construct($message);
    }

    public static function invalid(): self
    {
        return new self('invalid', 'This invitation link is invalid.', 404);
    }

    public static function notUsable(string $status): self
    {
        $messages = [
            'accepted' => 'This invitation has already been used.',
            'expired' => 'This invitation has expired. Ask your team leader to send a new one.',
            'revoked' => 'This invitation was cancelled by the team leader.',
        ];

        return new self($status, $messages[$status] ?? 'This invitation can no longer be used.', 410);
    }

    public static function emailMismatch(string $invitedEmail): self
    {
        return new self(
            'email_mismatch',
            "This invitation was sent to {$invitedEmail}. Log in with that email to accept it.",
            403
        );
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'reason' => $this->reason], $this->status);
    }
}
