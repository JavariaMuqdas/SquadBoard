You're invited to join {{ $projectName }}

Hello,

{{ $inviterName }} has invited you to join {{ $projectName }} on SquadBoard as {{ $roleArticle }} {{ strtolower($roleLabel) }}.

{{ $roleDescription }}

PROJECT DETAILS
@foreach ($details as $label => $value)
- {{ $label }}: {{ $value }}
@endforeach

Accept the invitation:
{{ $url }}

This invitation expires on {{ $expiresAt }}.

If you weren't expecting this invitation, you can safely ignore this email. No account will be created and nothing will change unless you accept.

—
Sent by SquadBoard on behalf of {{ $inviterName }}.
This email was sent to {{ $recipient }}.