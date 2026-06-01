import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const payload = await verifyAuthToken(token);

    if (payload.role !== "admin") {
      return apiError("Unauthorized.", { status: 401 });
    }

    return apiSuccess({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch {
    return apiError("Unauthorized.", { status: 401 });
  }
}
