"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to request password reset.");
        return;
      }

      setSuccess(result.data?.message || "Password reset instructions sent.");
      toast.success("Instructions sent. Check your email.");
    } catch {
      setError("Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md border border-brand-border bg-brand-white px-6 py-10 shadow-card sm:px-10 sm:py-14">
          <p className="text-center text-xs uppercase tracking-widest text-brand-black/50">
            Waves collective
          </p>
          <h1 className="mt-4 text-center font-serif text-3xl">
            Reset Password
          </h1>
          <p className="mt-2 text-center text-xs text-brand-black/60">
            Enter your email below to receive password reset instructions.
          </p>

          {success ? (
            <div className="mt-8 space-y-6 text-center">
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 p-4">
                {success}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-xs uppercase tracking-widest text-brand-black underline hover:text-brand-gold"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-8">
              <Input
                label="Email Address"
                name="email"
                type="email"
                required
              />
              
              {error && <p className="text-xs text-red-600">{error}</p>}
              
              <div className="space-y-4">
                <Button type="submit" fullWidth loading={loading}>
                  Send Reset Link
                </Button>
                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-block text-xs uppercase tracking-widest text-brand-black/50 hover:text-brand-gold"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
