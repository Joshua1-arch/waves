import { apiError, apiSuccess } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

// GET /api/auth/verify-email?token=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return apiError("Verification token is missing.", { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return apiError(
        "This verification link is invalid or has expired. Please request a new one.",
        { status: 400 }
      );
    }

    // Mark email as verified and clear the token
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return apiSuccess({
      message: "Your email has been confirmed. You may now sign in.",
    });
  } catch {
    return apiError("Unable to verify email. Please try again.", {
      status: 500,
    });
  }
}

// POST /api/auth/verify-email  — resend verification email
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

    // Generic response to prevent user enumeration
    if (!user || user.emailVerified) {
      return apiSuccess({
        message:
          "If that account exists and is unverified, a new link has been sent.",
      });
    }

    const crypto = await import("crypto");
    const { sendWelcomeEmail } = await import("@/lib/email");

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    await sendWelcomeEmail({ to: user.email, name: user.name, verificationToken: token });

    return apiSuccess({
      message:
        "If that account exists and is unverified, a new link has been sent.",
    });
  } catch {
    return apiError("Unable to resend verification email.", { status: 500 });
  }
}
