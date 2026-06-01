import { apiError, apiSuccess } from "@/lib/api-response";
import { setAdminAuthCookie } from "@/lib/auth-cookies";
import { signAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "admin-signin");

  if (rateLimit.limited) {
    return apiError("Too many admin signin attempts. Please try again later.", {
      status: 429,
      details: {
        retryAfter: rateLimit.retryAfter,
      },
    });
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return apiError("Email and password are required.", { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return apiError("Invalid credentials.", { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return apiError("Invalid credentials.", { status: 401 });
    }

    if (user.role !== "admin") {
      return apiError("Unauthorized admin access.", { status: 403 });
    }

    const token = await signAuthToken({
      sub: String(user._id),
      name: user.name,
      email: user.email,
      role: "admin",
    });

    console.log("[admin/signin] setting admin auth cookie", {
      cookieName: "wave_admin_auth_token",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
    });

    await setAdminAuthCookie(token);

    return apiSuccess({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[admin/signin] unable to sign in", {
      error: error instanceof Error ? error.message : "Unknown error",
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      nodeEnv: process.env.NODE_ENV,
    });
    return apiError("Unable to sign in to admin.", { status: 500 });
  }
}
