"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  adminLogin: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      login: (email, _password) => {
        set({
          user: { name: "Guest Member", email },
          isAdmin: false,
        });
        return true;
      },
      signup: (name, email, _password) => {
        set({ user: { name, email }, isAdmin: false });
        return true;
      },
      adminLogin: (email, _password) => {
        if (email.includes("admin") || email === "admin@waveandco.arch") {
          set({
            user: { name: "Admin User", email },
            isAdmin: true,
          });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, isAdmin: false }),
    }),
    { name: "wave-auth" },
  ),
);
