"use client";

import { AdminFooter } from "@/components/admin/AdminFooter";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-brand-cream">
        <AdminSidebar />
        <div className="flex min-h-screen flex-col lg:pl-64">
          <main className="flex-1 px-6 py-10 lg:px-10">{children}</main>
          <AdminFooter />
        </div>
      </div>
    </AdminGuard>
  );
}
