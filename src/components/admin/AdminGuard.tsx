"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isAdmin && !isLoginPage) {
      router.replace("/admin/login");
    }
    if (isAdmin && isLoginPage) {
      router.replace("/admin");
    }
  }, [isAdmin, isLoginPage, router]);

  if (!isAdmin && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
