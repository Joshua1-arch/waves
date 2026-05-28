import { apiSuccess } from "@/lib/api-response";
import { clearAdminAuthCookie } from "@/lib/auth-cookies";

export async function POST() {
  await clearAdminAuthCookie();

  return apiSuccess({ success: true });
}
