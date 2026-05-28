"use client";

import { AdminFooter } from "@/components/admin/AdminFooter";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  if (isLogin) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-brand-cream">
        <AdminSidebar mobileOpen={mobileSidebarOpen} onMobileClose={handleCloseSidebar} />
        <div className="flex min-h-screen flex-col md:pl-20 lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-white/95 backdrop-blur md:hidden">
            <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4">
              <button
                type="button"
                aria-label="Open admin navigation"
                aria-expanded={mobileSidebarOpen}
                aria-controls="admin-mobile-sidebar"
                onClick={handleOpenSidebar}
                className="flex h-11 w-11 items-center justify-center border border-brand-border text-brand-black transition-colors hover:bg-brand-cream"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <div className="text-center">
                <p className="font-serif text-base tracking-wider">WAVE & CO.</p>
                <p className="text-[9px] uppercase tracking-[0.3em] text-brand-black/50">
                  Admin Portal
                </p>
              </div>

              <button
                type="button"
                aria-label="Admin account actions"
                className="flex h-11 w-11 items-center justify-center border border-brand-border text-[11px] font-medium uppercase tracking-[0.2em] text-brand-black transition-colors hover:bg-brand-cream"
              >
                AD
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
          <AdminFooter />
        </div>
      </div>
    </AdminGuard>
  );
}
