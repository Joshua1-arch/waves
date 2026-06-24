import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { sanitizeNoSql, validatePassword } from "@/lib/utils";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "signup");

  if (rateLimit.limited) {
    return apiError("Too many signup attempts. Please try again later.", {
      status: 429,
      details: { retryAfter: rateLimit.retryAfter },
    });
  }

  try {
    const rawBody = await request.json();
    const body = sanitizeNoSql(rawBody);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return apiError("Name, email, and password are required.", { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return apiError(passwordCheck.error || "Invalid password.", { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email }).select("_id").lean();

    if (existingUser) {
      return apiError("Email already exists.", { status: 409 });
    }

    // Generate email verification token (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create account — NOT yet active. emailVerified stays false until confirmed.
    await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send confirmation email via Brevo — fire-and-forget (non-blocking)
    sendWelcomeEmail({
      to: email,
      name,
      verificationToken,
    }).catch((err) =>
      console.error("[Signup] Failed to send welcome email:", err)
    );

    // DO NOT issue a cookie — user must verify their email before they can sign in
    return apiSuccess(
      {
        requiresVerification: true,
        message:
          "Account created! Please check your email and click the confirmation link to activate your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === 11000
    ) {
      return apiError("Email already exists.", { status: 409 });
    }

    return apiError("Unable to create account.", { status: 500 });
  }
}
