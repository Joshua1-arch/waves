"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">Settings</h1>
      <p className="mt-2 text-sm text-brand-black/50">
        Configure store preferences and admin account details.
      </p>

      <form
        className="mt-10 space-y-8 border border-brand-border bg-brand-white p-8"
        onSubmit={(e) => e.preventDefault()}
      >
        <Input label="Store Name" defaultValue="Wave & Co." />
        <Input label="Support Email" defaultValue="concierge@waveandco.arch" />
        <Input label="Currency" defaultValue="USD" />
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-black/70">
            Notifications
          </label>
          <label className="mt-3 flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked />
            Email on new orders
          </label>
          <label className="mt-2 flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked />
            Low stock alerts
          </label>
        </div>
        <Button type="submit">Save Settings</Button>
      </form>
    </div>
  );
}
