import { apiError, apiSuccess } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      return apiError("Email is required.", { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    // Generic response regardless of whether the user exists (prevents enumeration)
    const genericOk = apiSuccess({
      message:
        "If an account with that email exists, we have sent a password reset link.",
    });

    if (!user) {
      return genericOk;
    }

    // Generate a secure cryptographic reset token with a 1-hour expiry
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = rawToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Send branded password reset email via Brevo — fire-and-forget
    sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken: rawToken,
    }).catch((err) =>
      console.error("[ForgotPassword] Failed to send reset email:", err)
    );

    return genericOk;
  } catch {
    return apiError("Unable to request password reset. Please try again.", {
      status: 500,
    });
  }
}
