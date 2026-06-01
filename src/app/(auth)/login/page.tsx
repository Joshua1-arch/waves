"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid credentials.");
        return;
      }

      setUser(result.data.user);
      toast.success("Signin successful. Welcome back.");
      router.push("/");
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md border border-brand-border bg-brand-white px-10 py-14 shadow-card">
          <p className="text-center text-xs uppercase tracking-widest">
            Wave & Co
          </p>
          <h1 className="mt-4 text-center font-serif text-3xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-center font-serif text-sm italic text-brand-black/60">
            Architectural precision in every detail.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <Input
              label="Email Address"
              name="email"
              type="email"
              required
            />
            <div>
              <Input label="Password" name="password" type="password" required />
              <Link
                href="/forgot-password"
                className="mt-2 inline-block text-xs text-brand-gold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-brand-black/60">
            New to the collective?{" "}
            <Link
              href="/signup"
              className="text-brand-black underline hover:text-brand-gold"
            >
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
