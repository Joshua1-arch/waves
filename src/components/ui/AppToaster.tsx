"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        className: "border border-brand-border bg-brand-white text-brand-black",
      }}
    />
  );
}
