<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <title>You're invited to join {{ $projectName }}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .h1 { font-size: 24px !important; line-height: 32px !important; }
      .detail-label { display: block !important; width: 100% !important; padding-bottom: 2px !important; }
      .detail-value { display: block !important; width: 100% !important; padding-top: 0 !important; }
    }
    a { color: #4f46e5; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; -webkit-font-smoothing:antialiased;">

  {{-- Preview text shown in the inbox list --}}
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f1f5f9;">
    {{ $inviterName }} has invited you to join {{ $projectName }} on SquadBoard as {{ $roleArticle }} {{ strtolower($roleLabel) }}.
    &#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 12px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          {{-- Logo --}}
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#4f46e5; border-radius:10px; width:36px; height:36px; text-align:center; vertical-align:middle; font-family:Arial, Helvetica, sans-serif; font-size:18px; font-weight:bold; color:#ffffff;">S</td>
                  <td style="padding-left:10px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:20px; font-weight:bold; color:#0b1020;">
                    Squad<span style="color:#4f46e5;">Board</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Card --}}
          <tr>
            <td style="background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">

              {{-- Header band --}}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="px" style="background-color:#4f46e5; background-image:linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#c026d3 100%); border-radius:16px 16px 0 0; padding:36px 40px 32px 40px;">
                    <p style="margin:0 0 10px 0; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#c7d2fe;">
                      Project invitation
                    </p>
                    <h1 class="h1" style="margin:0; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:28px; line-height:36px; font-weight:bold; color:#ffffff;">
                      You’re invited to join {{ $projectName }}
                    </h1>
                  </td>
                </tr>
              </table>

              {{-- Body --}}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="px" style="padding:32px 40px 8px 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#334155;">
                    <p style="margin:0 0 16px 0;">Hello,</p>
                    <p style="margin:0 0 16px 0;">
                      <strong style="color:#0b1020;">{{ $inviterName }}</strong> has invited you to join
                      <strong style="color:#0b1020;">{{ $projectName }}</strong> on SquadBoard as {{ $roleArticle }}
                      <strong style="color:#0b1020;">{{ strtolower($roleLabel) }}</strong>.
                    </p>
                    <p style="margin:0 0 24px 0;">{{ $roleDescription }}</p>
                  </td>
                </tr>

                {{-- Project details --}}
                <tr>
                  <td class="px" style="padding:0 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                      <tr>
                        <td style="padding:20px 24px 8px 24px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:12px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; color:#64748b;">
                          Project details
                        </td>
                      </tr>
                      @foreach ($details as $label => $value)
                        <tr>
                          <td style="padding:0 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e2e8f0;">
                              <tr>
                                <td class="detail-label" width="38%" style="padding:12px 0; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:14px; color:#64748b; vertical-align:top;">{{ $label }}</td>
                                <td class="detail-value" style="padding:12px 0; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#0b1020; vertical-align:top;">{{ $value }}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      @endforeach
                      <tr><td style="height:8px; line-height:8px; font-size:8px;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>

                {{-- Button (bulletproof: works in Outlook too) --}}
                <tr>
                  <td align="center" class="px" style="padding:32px 40px 8px 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#4f46e5" style="border-radius:12px; background-color:#4f46e5;">
                          <a href="{{ $url }}" target="_blank"
                             style="display:inline-block; padding:16px 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:12px;">
                            Accept invitation &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" class="px" style="padding:12px 40px 0 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#64748b;">
                    This invitation expires on <strong style="color:#334155;">{{ $expiresAt }}</strong>.
                  </td>
                </tr>

                {{-- Fallback link --}}
                <tr>
                  <td class="px" style="padding:28px 40px 0 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#64748b;">
                    If the button doesn’t work, copy and paste this link into your browser:<br>
                    <a href="{{ $url }}" target="_blank" style="color:#4f46e5; word-break:break-all;">{{ $url }}</a>
                  </td>
                </tr>

                {{-- Divider + note --}}
                <tr>
                  <td class="px" style="padding:28px 40px 36px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="border-top:1px solid #e2e8f0; font-size:0; line-height:0;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:20px 0 0 0; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#64748b;">
                      If you weren’t expecting this invitation, you can safely ignore this email. No account will be created and nothing will change unless you accept.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td align="center" class="px" style="padding:28px 40px 0 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:12px; line-height:19px; color:#94a3b8;">
              Sent by SquadBoard on behalf of {{ $inviterName }}.<br>
              SquadBoard helps student teams plan their work, meet deadlines, and show who contributed what.<br>
              This email was sent to {{ $recipient }}.
              <br><br>
              &copy; {{ date('Y') }} SquadBoard
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>