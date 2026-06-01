"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to reset password.");
        return;
      }

      setSuccess("Your password has been successfully reset.");
      toast.success("Password reset successful. Redirecting to login...");
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-brand-border bg-brand-white px-10 py-14 shadow-card">
      <p className="text-center text-xs uppercase tracking-widest text-brand-black/50">
        Waves collective
      </p>
      <h1 className="mt-4 text-center font-serif text-3xl">
        New Password
      </h1>
      <p className="mt-2 text-center text-xs text-brand-black/60">
        Create a new secure password for your Waves account.
      </p>

      {success ? (
        <div className="mt-8 space-y-6 text-center">
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 p-4">
            {success}
          </p>
          <p className="text-xs text-brand-black/50">Redirecting to Sign In page...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <Input
            label="New Password"
            name="password"
            type="password"
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
          />
          
          {error && <p className="text-xs text-red-600">{error}</p>}
          {!token && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3">
              Error: Missing or invalid password reset token. Please request another password reset email.
            </p>
          )}
          
          <Button type="submit" fullWidth disabled={loading || !token}>
            {loading ? "Resetting..." : "Save Password"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <Suspense fallback={
          <div className="w-full max-w-md border border-brand-border bg-brand-white px-10 py-14 shadow-card text-center animate-pulse">
            <p className="text-xs uppercase tracking-widest text-brand-black/50">Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </PageTransition>
  );
}
