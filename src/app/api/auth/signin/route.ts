import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { setAdminAuthCookie, setAuthCookie } from "@/lib/auth-cookies";
import { signAuthToken } from "@/lib/auth-jwt";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "signin");

  if (rateLimit.limited) {
    return apiError("Too many signin attempts. Please try again later.", {
      status: 429,
      details: {
        retryAfter: rateLimit.retryAfter,
      },
    });
  }

  try {
    console.log("[auth/signin] parsing request body");
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return apiError("Email and password are required.", { status: 400 });
    }

    console.log("[auth/signin] connecting to database");
    await connectToDatabase();
    console.log("[auth/signin] database connected");

    console.log("[auth/signin] finding user by email");
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("[auth/signin] user not found");
      return apiError("Invalid credentials.", { status: 401 });
    }

    console.log("[auth/signin] user found, comparing password");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("[auth/signin] password mismatch");
      return apiError("Invalid credentials.", { status: 401 });
    }

    console.log("[auth/signin] password matched, signing token");
    const token = await signAuthToken({
      sub: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    });
    console.log("[auth/signin] token signed, setting cookie");

    await setAuthCookie(token);

    if (user.role === "admin") {
      console.log("[auth/signin] admin user detected, setting admin cookie");
      await setAdminAuthCookie(token);
    }

    console.log("[auth/signin] cookie set, returning success response");

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
    console.error("[auth/signin] unexpected error", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred during signin.";

    return apiError(`Unable to sign in. ${message}`, { status: 500 });
  }
}
