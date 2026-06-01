import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  return payload.role === "admin" ? payload : null;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return apiError("Current password and new password are required.", { status: 400 });
    }

    if (newPassword.length < 8) {
      return apiError("New password must be at least 8 characters long.", { status: 400 });
    }

    await connectToDatabase();

    // Fetch the admin user record including the hidden password field
    const user = await User.findById(admin.sub).select("+password");

    if (!user) {
      return apiError("Admin user record not found.", { status: 404 });
    }

    // Verify current password is valid
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return apiError("Incorrect current password.", { status: 400 });
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return apiSuccess({
      message: "Password changed successfully.",
    });
  } catch (error) {
    return apiError("Unable to change password. Please try again.", { status: 500 });
  }
}
