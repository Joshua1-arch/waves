"use client";

import { PageTransition } from "@/components/ui/PageTransition";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.data?.message || "Your email has been confirmed.");
          // Redirect to login after 3 seconds
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Unable to verify your email. Please try again.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="w-full max-w-md border border-brand-border bg-brand-white px-6 py-10 shadow-card sm:px-10 sm:py-14">
      <p className="text-center text-xs uppercase tracking-widest text-brand-black/50">
        Wave &amp; Co
      </p>
      <h1 className="mt-4 text-center font-serif text-3xl">
        Email Verification
      </h1>

      <div className="mt-10 text-center space-y-6">
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-black/20 border-t-brand-black" />
            <p className="text-sm text-brand-black/60">Verifying your email address…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 p-4">
              {message}
            </p>
            <p className="text-xs text-brand-black/50">Redirecting you to sign in…</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-4">
              {message}
            </p>
            <div className="space-y-3">
              <ResendForm />
              <Link
                href="/login"
                className="block text-xs uppercase tracking-widest text-brand-black/50 hover:text-brand-gold"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3">
        If that account exists and is unverified, a new link has been sent.
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 border border-brand-border bg-brand-white px-3 py-2 text-xs focus:outline-none focus:border-brand-black"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-brand-black text-brand-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-brand-black/80 disabled:opacity-50"
      >
        {loading ? "…" : "Resend"}
      </button>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <Suspense
          fallback={
            <div className="w-full max-w-md border border-brand-border bg-brand-white px-10 py-14 shadow-card text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-black/20 border-t-brand-black" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </PageTransition>
  );
}
