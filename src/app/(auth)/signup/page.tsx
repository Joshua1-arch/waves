"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { cn, validatePassword } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(""); // set after successful signup
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const passwordInput = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    const agreeToTerms = fd.get("agreeToTerms");

    if (!name || !email || !passwordInput || !confirmPassword) {
      setError("All fields are required.");
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

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: passwordInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to create account.");
        return;
      }

      // Account created — user must now verify their email before they can sign in
      setPendingEmail(email);
    } catch {
      setError("Unable to create account.");
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

  // ── Check your email state ───────────────────────────────────────────────────
  if (pendingEmail) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-md border border-brand-border bg-brand-white px-6 py-10 shadow-card sm:px-10 sm:py-14 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border border-brand-border">
                <svg
                  className="h-8 w-8 text-brand-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-brand-black/50">
                Wave &amp; Co
              </p>
              <h1 className="mt-3 font-serif text-2xl">Check Your Email</h1>
            </div>

            <p className="text-sm text-brand-black/70 leading-relaxed">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-medium text-brand-black">{pendingEmail}</span>.
              <br />
              Please click the link in that email to activate your account.
            </p>

            <div className="bg-amber-50 border border-amber-100 p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                You must confirm your email before you can sign in.
                The link expires in <strong>24 hours</strong>.
              </p>
            </div>

            <ResendButton email={pendingEmail} />

            <Link
              href="/login"
              className="block text-xs uppercase tracking-widest text-brand-black/40 hover:text-brand-gold transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ── Signup form ──────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md border border-brand-border bg-brand-white px-6 py-10 shadow-card sm:px-10 sm:py-14">
          <p className="text-center text-xs uppercase tracking-widest">
            Wave &amp; Co
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
            <div>
              <Input
                label="Password"
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
              {loading ? "Creating Account…" : "Create Account"}
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

// ── Resend confirmation link ──────────────────────────────────────────────────
function ResendButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  const handleResend = async () => {
    setState("loading");
    try {
      await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState("sent");
    } catch {
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3">
        A new confirmation link has been sent to your inbox.
      </p>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={state === "loading"}
      className="text-xs uppercase tracking-widest text-brand-gold hover:underline disabled:opacity-50"
    >
      {state === "loading" ? "Sending…" : "Resend Confirmation Email"}
    </button>
  );
}
