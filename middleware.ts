import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE_NAME, AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";

const customerProtectedRoutes = ["/account"];
const adminProtectedRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isCustomerProtectedRoute = customerProtectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAdminProtectedRoute = adminProtectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAdminLoginPage = pathname === "/admin/login";

  if (isAdminProtectedRoute && !isAdminLoginPage) {
    const adminToken = request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      const payload = verifyAuthToken(adminToken);

      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (!isCustomerProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  try {
    verifyAuthToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
