// ─────────────────────────────────────────────────────────────────────────────
// Wave & Co — Email Library (Brevo Transactional API)
// ─────────────────────────────────────────────────────────────────────────────

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = process.env.EMAIL_SENDER || "noreply@waveandcolux.com";
const SENDER_NAME = process.env.EMAIL_SENDER_NAME || "Wave & Co";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.waveandcolux.com";

// ── Shared HTML shell ─────────────────────────────────────────────────────────

function emailShell(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wave &amp; Co</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background-color: #F7F5F0;
      color: #1A1A1A;
      padding: 40px 16px;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E0DDD7;
      padding: 48px 40px;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #E0DDD7;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand {
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #7A7060;
      margin-bottom: 8px;
    }
    .logo {
      font-size: 26px;
      letter-spacing: 0.15em;
      font-weight: 400;
      color: #1A1A1A;
    }
    .logo span {
      color: #C9A84C;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.8;
      color: #3D3830;
      margin-bottom: 16px;
    }
    .cta-wrap {
      text-align: center;
      margin: 36px 0;
    }
    .cta-btn {
      display: inline-block;
      background-color: #1A1A1A;
      color: #C9A84C !important;
      text-decoration: none;
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 16px 40px;
      border: 1px solid #1A1A1A;
    }
    .divider {
      border: none;
      border-top: 1px solid #E0DDD7;
      margin: 28px 0;
    }
    .footer {
      text-align: center;
      font-family: 'Arial', sans-serif;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #A09880;
      margin-top: 32px;
    }
    .footer a {
      color: #A09880;
      text-decoration: none;
    }
    .small-link {
      font-family: 'Arial', sans-serif;
      font-size: 11px;
      color: #A09880;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <p class="brand">The Collection</p>
        <div class="logo">WAVE <span>&amp;</span> CO</div>
      </div>
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Wave &amp; Co &mdash; <a href="${BASE_URL}">waveandcolux.com</a></p>
      <p style="margin-top:6px;">This email was sent automatically. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Core dispatcher ───────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<boolean> {
  const brevoApiKey = process.env.BREVO_API_KEY;

  // Dev/skeleton mode — log to console when no API key is configured
  if (!brevoApiKey) {
    console.log("─────────── EMAIL SKELETON MODE ───────────");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:    ${text ?? "N/A"}`);
    console.log("───────────────────────────────────────────");
    return true;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (response.ok) {
      console.log(`[Email] ✓ Sent "${subject}" → ${to}`);
      return true;
    }

    const err = await response.json();
    console.error(`[Email] ✗ Brevo error:`, err);
    return false;
  } catch (err) {
    console.error(`[Email] ✗ Network error:`, err);
    return false;
  }
}

// ── Template: Welcome / Account Confirmation ──────────────────────────────────

export async function sendWelcomeEmail({
  to,
  name,
  verificationToken,
}: {
  to: string;
  name: string;
  verificationToken: string;
}): Promise<boolean> {
  const verifyUrl = `${BASE_URL}/verify-email?token=${verificationToken}`;

  const html = emailShell(`
    <p class="body-text">Dear ${name},</p>
    <p class="body-text">
      Welcome to Wave &amp; Co. We're delighted to have you as part of our collective.
    </p>
    <p class="body-text">
      Please confirm your email address to activate your account and unlock the full
      Wave &amp; Co. experience.
    </p>
    <div class="cta-wrap">
      <a href="${verifyUrl}" class="cta-btn">Confirm My Account</a>
    </div>
    <hr class="divider" />
    <p class="body-text" style="font-size:13px;">
      If the button above doesn't work, copy and paste the link below into your browser:
    </p>
    <p class="small-link">${verifyUrl}</p>
    <hr class="divider" />
    <p class="body-text" style="font-size:13px; color:#7A7060;">
      This confirmation link expires in 24 hours. If you did not create an account,
      you can safely ignore this email.
    </p>
  `);

  return sendEmail({
    to,
    subject: "Confirm Your Wave & Co Account",
    html,
    text: `Welcome to Wave & Co, ${name}! Please confirm your email by visiting: ${verifyUrl}`,
  });
}

// ── Template: Password Reset ──────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: {
  to: string;
  name: string;
  resetToken: string;
}): Promise<boolean> {
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;

  const html = emailShell(`
    <p class="body-text">Dear ${name},</p>
    <p class="body-text">
      We received a request to reset the password for your Wave &amp; Co account.
    </p>
    <p class="body-text">
      Click the button below to create a new password. This link is valid for
      <strong>1 hour</strong>.
    </p>
    <div class="cta-wrap">
      <a href="${resetUrl}" class="cta-btn">Reset My Password</a>
    </div>
    <hr class="divider" />
    <p class="body-text" style="font-size:13px;">
      If the button above doesn't work, copy and paste the link below into your browser:
    </p>
    <p class="small-link">${resetUrl}</p>
    <hr class="divider" />
    <p class="body-text" style="font-size:13px; color:#7A7060;">
      If you did not request a password reset, please disregard this email.
      Your current password will remain unchanged and your account is safe.
    </p>
  `);

  return sendEmail({
    to,
    subject: "Reset Your Wave & Co Password",
    html,
    text: `Hi ${name}, reset your Wave & Co password by visiting: ${resetUrl} — This link expires in 1 hour.`,
  });
}
