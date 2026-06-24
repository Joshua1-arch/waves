"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { cn, validatePassword } from "@/lib/utils";
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
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData(e.currentTarget);
    const passwordInput = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");

    if (!passwordInput || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    const check = validatePassword(passwordInput);
    if (!check.valid) {
      setError(check.error || "Password does not meet requirements.");
      return;
    }

    if (passwordInput !== confirmPassword) {
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
        body: JSON.stringify({ token, password: passwordInput }),
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

  const requirements = [
    { met: password.length >= 6, label: "6+ characters" },
    { met: /[A-Z]/.test(password), label: "Block Letter (A-Z)" },
    { met: /[0-9]/.test(password), label: "One number (0-9)" },
    { met: /[^A-Za-z0-9]/.test(password), label: "Special symbol" },
  ];

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
          <div>
            <Input
              label="New Password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-brand-cream border border-brand-border text-[9px] uppercase tracking-widest">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      req.met ? "bg-emerald-600" : "bg-brand-black/20"
                    )} />
                    <span className={cn(
                      "transition-colors",
                      req.met ? "text-brand-black font-semibold" : "text-brand-black/45"
                    )}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            {loading ? "Saving Password..." : "Save Password"}
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
