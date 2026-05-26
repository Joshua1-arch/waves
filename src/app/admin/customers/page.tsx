"use client";

import { Button } from "@/components/ui/Button";
import { customers } from "@/lib/admin-data";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminCustomersPage() {
  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Customers</h1>
          <p className="mt-1 max-w-lg text-sm text-brand-black/50">
            Manage your clientele directory. View profiles, order history, and
            communication preferences.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/40" />
            <input
              type="search"
              placeholder="Search directory"
              className="border border-brand-border py-2 pl-10 pr-4 text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
          </div>
          <Button>Export List</Button>
        </div>
      </div>

      <div className="mt-8 border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Join Date</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-brand-border">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10 overflow-hidden bg-brand-cream grayscale">
                      <Image
                        src={c.avatar}
                        alt={c.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-brand-black/70">{c.email}</td>
                <td className="px-6 py-4">{c.joinDate}</td>
                <td className="px-6 py-4">
                  {String(c.orders).padStart(2, "0")}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href="#"
                    className="text-xs uppercase tracking-widest text-brand-gold underline"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
