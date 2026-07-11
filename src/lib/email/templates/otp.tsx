const brandColor = "#2563eb";
const bgColor = "#ffffff";
const darkBg = "#0f172a";
const darkCard = "#1e293b";
const textColor = "#1e293b";
const darkText = "#e2e8f0";
const mutedColor = "#64748b";
const darkMuted = "#94a3b8";

export function renderOtpEmail(otp: string, expiresInMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Your OTP Code</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .body { background-color: ${darkBg} !important; }
        .card { background-color: ${darkCard} !important; }
        .text { color: ${darkText} !important; }
        .muted { color: ${darkMuted} !important; }
        .otp-box { background-color: #1e293b !important; border-color: #334155 !important; }
        .otp-text { color: ${brandColor} !important; }
        .divider { background-color: #334155 !important; }
        .footer-link { color: ${darkMuted} !important; }
      }
    </style>
  </head>
  <body class="body" style="margin:0;padding:0;background-color:${bgColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" class="card" style="max-width:480px;width:100%;background-color:${bgColor};border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:32px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <span style="font-size:28px;font-weight:700;color:${brandColor};">Workforce</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <h1 class="text" style="margin:0;font-size:24px;font-weight:600;color:${textColor};">Your verification code</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <p class="muted" style="margin:0;font-size:15px;color:${mutedColor};line-height:1.5;">
                        Use this code to complete your login or registration.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="otp-box" style="padding:16px 40px;background-color:#f1f5f9;border-radius:8px;border:1px solid #e2e8f0;letter-spacing:12px;">
                            <span class="otp-text" style="font-size:36px;font-weight:700;color:${brandColor};font-family:'Courier New',Courier,monospace;">${otp}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <p class="muted" style="margin:0;font-size:13px;color:${mutedColor};">
                        This code expires in <strong>${expiresInMinutes} minutes</strong>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <p class="muted" style="margin:0;font-size:13px;color:${mutedColor};line-height:1.5;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td class="divider" style="height:1px;background-color:#e2e8f0;margin:0 32px;"></td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:24px 32px 0;">
                      <p class="muted" style="margin:0;font-size:12px;color:${mutedColor};line-height:1.5;">
                        <strong style="color:${textColor};">Security notice:</strong> Never share this code with anyone. Workforce will never ask for your OTP outside of the login page.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:12px 32px 32px;">
                      <p class="muted" style="margin:0;font-size:12px;color:${mutedColor};">
                        Need help? <a class="footer-link" href="mailto:support@workforce.in" style="color:${mutedColor};text-decoration:underline;">Contact support</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
