import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "wave_auth_token";
export const ADMIN_AUTH_COOKIE_NAME = "wave_admin_auth_token";
export const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_TOKEN_MAX_AGE,
  };
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

export async function setAdminAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });
}

export async function clearAdminAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE_NAME, "", {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });
}
