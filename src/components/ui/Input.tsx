"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  underline?: boolean;
}

export function Input({
  className,
  label,
  underline = true,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-medium uppercase tracking-widest text-brand-black/70"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full bg-transparent text-sm text-brand-black outline-none transition-all duration-300 placeholder:text-brand-black/40 focus:ring-2 focus:ring-brand-gold/40",
          underline
            ? "border-0 border-b border-brand-border py-2 focus:border-brand-gold"
            : "border border-brand-border px-4 py-3 focus:border-brand-gold",
        )}
        {...props}
      />
    </div>
  );
}
