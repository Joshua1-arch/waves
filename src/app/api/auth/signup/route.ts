import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { setAuthCookie } from "@/lib/auth-cookies";
import { signAuthToken } from "@/lib/auth-jwt";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "signup");

  if (rateLimit.limited) {
    return apiError("Too many signup attempts. Please try again later.", {
      status: 429,
      details: {
        retryAfter: rateLimit.retryAfter,
      },
    });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return apiError("Name, email, and password are required.", { status: 400 });
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters.", { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email }).select("_id").lean();

    if (existingUser) {
      return apiError("Email already exists.", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = await signAuthToken({
      sub: String(user._id),
      name: user.name,
      email: user.email,
    });

    await setAuthCookie(token);

    return apiSuccess(
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return apiError("Email already exists.", { status: 409 });
    }

    return apiError("Unable to create account.", { status: 500 });
  }
}
