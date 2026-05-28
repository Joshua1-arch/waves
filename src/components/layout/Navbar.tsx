"use client";

import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated, isAdmin, initialized } = useUser();
  const logout = useAuthStore((state) => state.logout);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const openCart = useCartStore((s) => s.openCart);
  const isHome = pathname === "/";
  const firstName = user?.name?.split(" ")[0] ?? "Account";

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 60);
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await logout();
    setAccountMenuOpen(false);
    toast.success("Signed out successfully.");
    router.push("/");
  };

  const iconButtonClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/70 focus:ring-offset-2 focus:ring-offset-transparent";

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || !isHome
          ? "border-b border-brand-border bg-brand-white"
          : "bg-transparent",
      )}
    >
      <div className="section-shell flex h-20 items-center justify-between gap-3 sm:gap-4">
        <Link
          href="/"
          className={cn(
            "shrink-0 font-serif text-base tracking-wider sm:text-lg",
            scrolled || !isHome ? "text-brand-black" : "text-brand-white",
          )}
        >
          WAVE & CO.
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs uppercase tracking-widest transition-colors",
                pathname === link.href && "border-b border-current pb-0.5",
                scrolled || !isHome
                  ? "text-brand-black hover:text-brand-gold"
                  : "text-brand-white/90 hover:text-brand-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "flex items-center gap-1 sm:gap-2",
            scrolled || !isHome ? "text-brand-black" : "text-brand-white",
          )}
        >
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-nav"
            className={cn(iconButtonClass, "md:hidden")}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            aria-label="Search"
            className={cn(iconButtonClass, "hidden sm:inline-flex")}
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Wishlist"
            className={cn(iconButtonClass, "hidden sm:inline-flex")}
          >
            <Heart className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Cart"
            className={cn(iconButtonClass, "relative")}
            onClick={openCart}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center bg-brand-gold px-1 text-[9px] text-brand-black">
                {itemCount}
              </span>
            )}
          </button>

          {initialized && isAuthenticated ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                aria-label="Open account menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="flex min-h-11 items-center gap-2 rounded-full px-3 uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-brand-gold/70 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                <User className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="hidden text-[10px] sm:inline">{firstName}</span>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-4 w-56 border border-brand-border bg-brand-black text-brand-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block border-b border-brand-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.25em] transition-colors hover:bg-brand-white/5"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="block border-b border-brand-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.25em] transition-colors hover:bg-brand-white/5"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    className="block border-b border-brand-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.25em] transition-colors hover:bg-brand-white/5"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    Order History
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-5 py-4 text-left text-[10px] uppercase tracking-[0.25em] transition-colors hover:bg-brand-white/5"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Account"
              className={iconButtonClass}
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-brand-border bg-brand-white/95 backdrop-blur md:hidden">
          <nav
            id="mobile-site-nav"
            className="section-shell flex max-h-[calc(100vh-5rem)] flex-col gap-2 overflow-y-auto py-5"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-12 items-center border-b border-brand-border/60 py-2 text-sm uppercase tracking-widest text-brand-black transition-colors hover:text-brand-gold",
                  pathname === link.href && "text-brand-gold",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </motion.header>
  );
}
