"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all security fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to change password.");
        return;
      }

      setSuccess("Your password has been successfully updated.");
      toast.success("Security credentials updated successfully.");
      e.currentTarget.reset();
    } catch {
      setError("Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-brand-black/50">
          Configure store preferences and admin account credentials.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Store Preferences Pane */}
        <form
          className="space-y-8 border border-brand-border bg-brand-white p-8"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Store configurations updated successfully.");
          }}
        >
          <div>
            <h2 className="font-serif text-lg">Store Preferences</h2>
            <p className="text-[10px] uppercase tracking-widest text-brand-black/40">
              General display settings
            </p>
          </div>

          <Input label="Store Name" defaultValue="Wave & Co." name="storeName" required />
          <Input label="Support Email" defaultValue="concierge@waveandco.arch" name="supportEmail" type="email" required />
          <Input label="Currency" defaultValue="USD" name="currency" required />
          
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-black/70">
              Notifications
            </label>
            <label className="mt-3 flex items-center gap-3 text-sm">
              <input type="checkbox" defaultChecked className="accent-brand-black" />
              Email on new orders
            </label>
            <label className="mt-2 flex items-center gap-3 text-sm">
              <input type="checkbox" defaultChecked className="accent-brand-black" />
              Low stock alerts
            </label>
          </div>
          
          <Button type="submit">Save Preferences</Button>
        </form>

        {/* Security & Access Pane */}
        <form
          className="space-y-8 border border-brand-border bg-brand-white p-8"
          onSubmit={handlePasswordChange}
        >
          <div>
            <h2 className="font-serif text-lg">Security & Access</h2>
            <p className="text-[10px] uppercase tracking-widest text-brand-black/40">
              Update password credentials
            </p>
          </div>

          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            required
          />

          <Input
            label="New Password"
            name="newPassword"
            type="password"
            required
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            required
          />

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3">
              {success}
            </p>
          )}

          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
