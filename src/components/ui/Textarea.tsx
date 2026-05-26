"use client";

import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ className, label, id, ...props }: TextareaProps) {
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
      <textarea
        id={inputId}
        className="min-h-[120px] w-full resize-none border border-brand-border bg-brand-white px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
        {...props}
      />
    </div>
  );
}
