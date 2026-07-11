const brandColor = "#2563eb";
const brandDark = "#3b82f6";
const bgColor = "#f8fafc";
const cardBg = "#ffffff";
const darkBg = "#0f172a";
const darkCard = "#1e293b";
const textColor = "#1e293b";
const darkText = "#e2e8f0";
const mutedColor = "#64748b";
const darkMuted = "#94a3b8";
const borderColor = "#e2e8f0";
const darkBorder = "#334155";

function otpBoxes(otp: string): string {
  const digits = otp.split("");
  const boxes = digits
    .map(
      (d, i) => `
        <td style="padding:0 ${i < digits.length - 1 ? "6" : "0"}px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td class="otp-digit" style="
                height:56px;
                width:48px;
                min-width:48px;
                text-align:center;
                vertical-align:middle;
                background-color:#f8fafc;
                border:1.5px solid ${borderColor};
                border-radius:10px;
                font-family:'Inter','SF Mono',SFMono-Regular,'Courier New',monospace;
                font-size:28px;
                font-weight:700;
                color:${textColor};
                line-height:56px;
                letter-spacing:0;
              ">
                ${d}
              </td>
            </tr>
          </table>
        </td>`
    )
    .join("");
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        ${boxes}
      </tr>
    </table>`;
}

export function renderOtpEmail(otp: string, expiresInMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Your Workforce verification code</title>
    <style>
      @media (prefers-color-scheme: dark) {
        body { background-color: ${darkBg} !important; }
        .card { background-color: ${darkCard} !important; border-color: ${darkBorder} !important; }
        .text { color: ${darkText} !important; }
        .muted { color: ${darkMuted} !important; }
        .otp-digit { background-color: #0f172a !important; border-color: ${darkBorder} !important; color: ${darkText} !important; }
        .divider { background-color: ${darkBorder} !important; }
        .footer-link { color: ${darkMuted} !important; }
        .brand { color: ${brandDark} !important; }
      }
      @media only screen and (max-width: 480px) {
        .card { border-radius: 0 !important; border-width: 0 !important; }
        .inner { padding: 24px 20px !important; }
        .otp-digit { height: 48px !important; width: 40px !important; min-width: 40px !important; font-size: 22px !important; line-height: 48px !important; }
      }
    </style>
  </head>
  <body style="
    margin:0;
    padding:0;
    background-color:${bgColor};
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  ">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="card" style="
            max-width:600px;
            width:100%;
            background-color:${cardBg};
            border:1px solid ${borderColor};
            border-radius:12px;
            box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04);
          ">
            <tr>
              <td class="inner" style="padding:40px 40px 0;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <span class="brand" style="font-size:22px;font-weight:700;color:${brandColor};letter-spacing:-0.5px;">Workforce</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:4px;">
                      <p class="muted" style="margin:0;font-size:13px;color:${mutedColor};font-weight:500;">Secure sign-in</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-top:32px;">
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <h1 class="text" style="margin:0;font-size:26px;font-weight:600;color:${textColor};letter-spacing:-0.3px;">Verify your email</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:4px;">
                      <p class="muted" style="margin:0;font-size:15px;color:${mutedColor};line-height:1.5;">
                        Use the verification code below to continue.
                      </p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0 28px;">
                  <tr>
                    <td align="center">
                      ${otpBoxes(otp)}
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <p class="muted" style="margin:0;font-size:13px;color:${mutedColor};">
                        This code expires in <strong style="font-weight:600;">${expiresInMinutes} minutes</strong>
                      </p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="divider" style="height:1px;background-color:${borderColor};font-size:0;line-height:0;">&zwj;</td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0 0;">
                  <tr>
                    <td align="center">
                      <p class="muted" style="margin:0;font-size:12px;color:${mutedColor};line-height:1.6;">
                        <strong class="text" style="color:${textColor};font-weight:600;">Security notice:</strong> Never share this code. Workforce will never ask for your verification code.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <tr>
              <td class="divider" style="height:1px;background-color:${borderColor};font-size:0;line-height:0;">&zwj;</td>
            </tr>

            <tr>
              <td style="padding:24px 40px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:12px;">
                      <span class="muted" style="font-size:14px;font-weight:600;color:${mutedColor};">Workforce</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:0 6px;">
                            <a href="mailto:support@workforce.in" class="footer-link" style="font-size:12px;color:${mutedColor};text-decoration:underline;text-underline-offset:2px;">Contact support</a>
                          </td>
                          <td style="padding:0 6px;">
                            <a href="#" class="footer-link" style="font-size:12px;color:${mutedColor};text-decoration:underline;text-underline-offset:2px;">Privacy policy</a>
                          </td>
                          <td style="padding:0 6px;">
                            <a href="#" class="footer-link" style="font-size:12px;color:${mutedColor};text-decoration:underline;text-underline-offset:2px;">Terms of service</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p class="muted" style="margin:0;font-size:11px;color:${mutedColor};line-height:1.5;">
                        &copy; ${new Date().getFullYear()} Workforce. All rights reserved.
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

export function renderOtpText(otp: string, expiresInMinutes: number): string {
  return [
    "Your Workforce verification code is:",
    "",
    `${otp}`,
    "",
    `This code expires in ${expiresInMinutes} minutes.`,
    "",
    "Security notice: Never share this code. Workforce will never ask for your verification code.",
    "",
    "If you didn't request this email, you can safely ignore it.",
    "",
    "Workforce",
    "Contact support: support@workforce.in",
  ].join("\n");
}
