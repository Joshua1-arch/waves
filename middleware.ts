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

    console.log("[middleware] admin cookie received", {
      pathname,
      cookieName: ADMIN_AUTH_COOKIE_NAME,
      hasAdminToken: Boolean(adminToken),
      nodeEnv: process.env.NODE_ENV,
    });

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const payload = verifyAuthToken(adminToken);

      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error("[middleware] admin token verification failed", {
        pathname,
        cookieName: ADMIN_AUTH_COOKIE_NAME,
        error: error instanceof Error ? error.message : "Unknown verification error",
      });
      return NextResponse.redirect(new URL("/admin/login", request.url));
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
