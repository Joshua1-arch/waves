"use client";

import { ADMIN_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import {
  Glasses,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  LayoutDashboard,
  Glasses,
  ShoppingCart,
  Users,
  Settings,
} as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-brand-border bg-brand-white">
      <div className="border-b border-brand-border px-6 py-8">
        <p className="font-serif text-lg tracking-wider">WAVE & CO.</p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-black/50">
          Admin Portal
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {ADMIN_NAV.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 border-l-2 px-4 py-3 text-sm transition-colors",
                active
                  ? "border-brand-gold bg-brand-cream text-brand-black"
                  : "border-transparent text-brand-black/60 hover:bg-brand-cream/50",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-brand-black text-xs text-brand-white">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2) || "AD"}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name ?? "Admin User"}</p>
            <p className="text-[10px] uppercase tracking-widest text-brand-black/50">
              System Operator
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 hover:underline"
        >
          <LogOut className="h-3 w-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
