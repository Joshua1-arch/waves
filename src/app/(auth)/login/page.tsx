"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    if (login(email, password)) {
      router.push("/");
    } else {
      setError("Invalid credentials.");
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
                href="#"
                className="mt-2 inline-block text-xs text-brand-gold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <Button type="submit" fullWidth>
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
