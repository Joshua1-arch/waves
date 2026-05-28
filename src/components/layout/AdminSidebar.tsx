"use client";

import { ADMIN_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import {
  Glasses,
  LayoutDashboard,
  LogOut,
  Paintbrush,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  LayoutDashboard,
  Glasses,
  ShoppingCart,
  Paintbrush,
  Users,
  Settings,
} as const;

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleClose = () => {
    onMobileClose?.();
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-brand-black/60 transition-opacity duration-200 md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={handleClose}
      />

      <aside
        id="admin-mobile-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-brand-border bg-brand-white transition-transform duration-300 md:w-20 lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-6 md:px-4 md:py-8 lg:px-6">
          <div className="min-w-0 md:w-full">
            <p className="font-serif text-lg tracking-wider md:text-center lg:text-left">
              <span className="md:hidden lg:inline">WAVE & CO.</span>
              <span className="hidden md:inline lg:hidden">W&C</span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-black/50 md:hidden lg:block">
              Admin Portal
            </p>
          </div>
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center border border-brand-border text-brand-black transition-colors hover:bg-brand-cream md:hidden"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6 md:px-2">
          {ADMIN_NAV.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-4 py-3 text-sm transition-colors md:justify-center md:px-0 lg:justify-start lg:px-4",
                  active
                    ? "border-brand-gold bg-brand-cream text-brand-black"
                    : "border-transparent text-brand-black/60 hover:bg-brand-cream/50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="md:hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-brand-border p-5 md:p-4 lg:p-6">
          <div className="flex items-center gap-3 md:justify-center lg:justify-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand-black text-xs text-brand-white">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "AD"}
            </div>
            <div className="md:hidden lg:block">
              <p className="text-sm font-medium">{user?.name ?? "Admin User"}</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-black/50">
                System Operator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              handleClose();
            }}
            aria-label="Log out"
            title="Logout"
            className="mt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 hover:underline md:justify-center lg:justify-start"
          >
            <LogOut className="h-3 w-3 shrink-0" />
            <span className="md:hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
