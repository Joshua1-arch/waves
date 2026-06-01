import { apiError, apiSuccess } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return apiError("Token and password are required.", { status: 400 });
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters long.", { status: 400 });
    }

    await connectToDatabase();

    // Find the user with matching reset token and where token expiration is in the future
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return apiError("Password reset token is invalid or has expired.", { status: 400 });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save new password and clear the reset token details
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return apiSuccess({
      message: "Your password has been successfully reset. You may now sign in.",
    });
  } catch (error) {
    return apiError("Unable to reset password. Please try again.", { status: 500 });
  }
}
