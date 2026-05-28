"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    const agreeToTerms = fd.get("agreeToTerms");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to create account.");
        return;
      }

      setUser(result.data.user);
      toast.success("Signup successful. Welcome to Wave & Co.");
      router.push("/");
    } catch {
      setError("Unable to create account.");
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
            Join the Collective
          </h1>
          <p className="mt-2 text-center text-sm text-brand-black/60">
            Create your account for exclusive access.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <Input label="Full Name" name="name" required />
            <Input label="Email Address" name="email" type="email" required />
            <Input label="Password" name="password" type="password" required />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
            />
            <label className="flex items-start gap-3 text-sm text-brand-black/70">
              <input
                type="checkbox"
                name="agreeToTerms"
                required
                className="mt-1 h-4 w-4 border border-brand-border text-brand-gold accent-brand-gold"
              />
              <span>I agree to the terms and conditions.</span>
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-brand-black/60">
            Already a member?{" "}
            <Link
              href="/login"
              className="text-brand-black underline hover:text-brand-gold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
