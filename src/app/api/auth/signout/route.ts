import { apiSuccess } from "@/lib/api-response";
import { clearAdminAuthCookie, clearAuthCookie } from "@/lib/auth-cookies";

export async function POST() {
  await clearAuthCookie();
  await clearAdminAuthCookie();
  return apiSuccess({ message: "Signed out successfully." });
}
