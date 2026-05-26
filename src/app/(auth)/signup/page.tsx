"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    signup(
      String(fd.get("name")),
      String(fd.get("email")),
      String(fd.get("password")),
    );
    router.push("/");
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
            <Button type="submit" fullWidth>
              Create Account
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
