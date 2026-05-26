"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "gold";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-brand-black text-brand-white hover:bg-brand-black/90",
  ghost:
    "border border-brand-white text-brand-white hover:bg-brand-white/10 bg-transparent",
  outline:
    "border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white bg-transparent",
  gold: "bg-brand-gold text-brand-black hover:bg-brand-gold/90",
};

export function Button({
  className,
  variant = "primary",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-8 py-3 text-xs font-medium uppercase tracking-widest transition-all duration-300",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
