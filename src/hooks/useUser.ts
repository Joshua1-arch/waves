"use client";

import { useAuthStore } from "@/store/auth";
import { useEffect } from "react";

export function useUser() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const initialized = useAuthStore((state) => state.initialized);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);

  useEffect(() => {
    if (!initialized) {
      void hydrateUser();
    }
  }, [hydrateUser, initialized]);

  return {
    user,
    isAuthenticated,
    isAdmin,
    initialized,
  };
}
