import { apiError, apiSuccess } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return apiError("Email is required.", { status: 400 });
    }

    await connectToDatabase();

    // Query for the user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    // If the user does not exist, return a generic success message to prevent user enumeration
    if (!user) {
      return apiSuccess({
        message: "If an account with that email exists, we have sent a password reset link.",
      });
    }

    // Generate cryptographic reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    
    // Set expiry for 1 hour from now
    const tokenExpiry = new Date(Date.now() + 3600000);

    // Save to user model
    user.resetPasswordToken = rawToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Construct reset password link
    const requestUrl = new URL(request.url);
    const resetUrl = `${requestUrl.protocol}//${requestUrl.host}/reset-password?token=${rawToken}`;

    // Premium designed Waves styled HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Georgia', serif;
            background-color: #FAF9F6;
            margin: 0;
            padding: 40px 20px;
            color: #1A1A1A;
          }
          .container {
            max-width: 600px;
            background-color: #FFFFFF;
            border: 1px solid #E5E5E0;
            padding: 40px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #E5E5E0;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            font-weight: 300;
          }
          .content {
            padding: 30px 0;
            line-height: 1.6;
          }
          .title {
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: normal;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            background-color: #1A1A1A;
            color: #D4AF37 !important;
            padding: 15px 35px;
            text-decoration: none;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            display: inline-block;
            transition: all 0.3s ease;
          }
          .footer {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(26, 26, 26, 0.4);
            text-align: center;
            border-top: 1px solid #E5E5E0;
            padding-top: 20px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">W A V E S</div>
          </div>
          <div class="content">
            <h1 class="title">Reset Your Password</h1>
            <p>We received a request to reset your password for your Waves account.</p>
            <p>Please click the link below to set a new password. This link is valid for 1 hour.</p>
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If you did not request a password reset, you can safely ignore this email. Your current password will remain secure.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Waves Collective. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    await sendEmail({
      to: user.email,
      subject: "Reset Your Waves Password",
      html: emailHtml,
      text: `Reset your Waves password by visiting this link: ${resetUrl}`,
    });

    return apiSuccess({
      message: "If an account with that email exists, we have sent a password reset link.",
    });
  } catch (error) {
    return apiError("Unable to request password reset. Please try again.", { status: 500 });
  }
}
