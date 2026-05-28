"use client";

import { useAuthStore } from "@/store/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch("/api/admin/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const result = (await response.json()) as {
            data?: {
              user?: {
                id: string;
                name: string;
                email: string;
                role?: "customer" | "admin";
              };
            };
          };

          if (result.data?.user) {
            setUser(result.data.user);
          }

          if (isLoginPage) {
            router.replace("/admin");
          }
          return;
        }

        setUser(null);

        if (!isLoginPage) {
          router.replace("/");
        }
      } finally {
        setCheckingSession(false);
      }
    };

    void checkAdminSession();
  }, [isLoginPage, router, setUser]);

  if (checkingSession) {
    return null;
  }

  if (!isAdmin && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
