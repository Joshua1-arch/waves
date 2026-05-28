"use client";

import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: "customer" | "admin";
  createdAt?: string | Date;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  hydrateUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  initialized: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      initialized: true,
    }),
  adminLogin: async (email, password) => {
    try {
      const response = await fetch("/api/admin/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        set({
          isAdmin: false,
          initialized: true,
        });
        return {
          success: false,
          error: result.error || "Unable to sign in to admin.",
        };
      }

      set({
        user: result.data.user,
        isAuthenticated: true,
        isAdmin: true,
        initialized: true,
      });

      return { success: true };
    } catch {
      set({
        isAdmin: false,
        initialized: true,
      });
      return {
        success: false,
        error: "Unable to sign in to admin.",
      };
    }
  },
  adminLogout: async () => {
    await fetch("/api/admin/signout", {
      method: "POST",
      credentials: "include",
    });

    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      initialized: true,
    });
  },
  hydrateUser: async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          initialized: true,
        });
        return;
      }

      const result = await response.json();

      set({
        user: result.data.user,
        isAuthenticated: true,
        isAdmin: result.data.user?.role === "admin",
        initialized: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        initialized: true,
      });
    }
  },
  logout: async () => {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    });

    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      initialized: true,
    });
  },
}));
