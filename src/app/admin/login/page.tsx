"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const adminLogin = useAuthStore((s) => s.adminLogin);
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    if (adminLogin(email, password)) {
      router.push("/admin");
    } else {
      setError("Use admin@waveandco.arch to sign in.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6">
      <div className="w-full max-w-md border border-brand-border bg-brand-white p-10">
        <p className="font-serif text-xl">WAVE & CO.</p>
        <p className="text-[10px] uppercase tracking-widest text-brand-black/50">
          Admin Portal
        </p>
        <h1 className="mt-6 font-serif text-2xl">Sign In</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue="admin@waveandco.arch"
            required
          />
          <Input label="Password" name="password" type="password" required />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" fullWidth>
            Enter Portal
          </Button>
        </form>
      </div>
    </div>
  );
}
