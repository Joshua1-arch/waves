"use client";

import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const openCart = useCartStore((s) => s.openCart);
  const isHome = pathname === "/";

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 60);
  });

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || !isHome
          ? "border-b border-brand-border bg-brand-white"
          : "bg-transparent",
      )}
    >
      <div className="section-shell flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className={cn(
            "font-serif text-lg tracking-wider",
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
            "flex items-center gap-4 sm:gap-5",
            scrolled || !isHome ? "text-brand-black" : "text-brand-white",
          )}
        >
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
          <button type="button" aria-label="Search" className="hidden sm:inline-flex">
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button type="button" aria-label="Wishlist" className="hidden sm:inline-flex">
            <Heart className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Cart"
            className="relative"
            onClick={openCart}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-brand-gold text-[9px] text-brand-black">
                {itemCount}
              </span>
            )}
          </button>
          <Link href="/login" aria-label="Account">
            <User className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-brand-border bg-brand-white md:hidden">
          <nav className="section-shell flex flex-col gap-5 py-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs uppercase tracking-widest text-brand-black transition-colors hover:text-brand-gold",
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
