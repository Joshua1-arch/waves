import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return apiError("Unauthorized.", { status: 401 });
    }

    return apiSuccess({ user });
  } catch {
    return apiError("Unauthorized.", { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (name.length < 2) {
      return apiError("Name must be at least 2 characters.", { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      authenticatedUser.id,
      { name },
      {
        runValidators: true,
      },
    );

    if (!user) {
      return apiError("User not found.", { status: 404 });
    }

    return apiSuccess({
      user: {
        ...authenticatedUser,
        name,
      },
    });
  } catch {
    return apiError("Unable to update profile.", { status: 500 });
  }
}
