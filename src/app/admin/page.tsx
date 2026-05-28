"use client";

import { MetricCard } from "@/components/admin/MetricCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dashboardMetrics, recentOrders } from "@/lib/admin-data";
import { formatPrice } from "@/lib/utils";
import { ArrowUpRight, Package } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h1 className="font-serif text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-brand-black/50">
            Performance analysis for Oct 2024
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto">
            Export Data
          </Button>
          <Button className="w-full sm:w-auto">Create New</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="border border-brand-border bg-brand-white p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-xl">Revenue Flow</h2>
            <span className="text-[10px] uppercase tracking-widest text-brand-black/40">
              Current Period
            </span>
          </div>
          <RevenueChart />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="bg-brand-black p-6 text-brand-white">
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">
              Collection Performance
            </p>
            <p className="mt-4 font-serif text-xl">The Linear Series</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-brand-white/70">
              92% Sell-Through Rate
            </p>
            <ArrowUpRight className="mt-4 h-4 w-4 text-brand-gold" />
          </div>
          <div className="bg-brand-gold p-6 text-brand-black">
            <Package className="h-5 w-5" />
            <p className="mt-4 text-sm font-medium">Restock Alert</p>
            <p className="mt-2 text-xs text-brand-black/70">
              Titanium Frame #04 is low on stock (2 units left).
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-brand-border bg-brand-white">
        <div className="flex flex-col gap-3 border-b border-brand-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="font-serif text-xl">Recent Orders</h2>
          <input
            type="search"
            placeholder="Search order #"
            className="w-full border border-brand-border px-4 py-2 text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-gold/40 sm:w-auto sm:min-w-56"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
                <th className="px-4 py-4 sm:px-6">Order ID</th>
                <th className="px-4 py-4 sm:px-6">Date</th>
                <th className="px-4 py-4 sm:px-6">Customer</th>
                <th className="px-4 py-4 sm:px-6">Status</th>
                <th className="px-4 py-4 sm:px-6">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-brand-border">
                  <td className="px-4 py-4 font-medium sm:px-6">{order.id}</td>
                  <td className="px-4 py-4 text-brand-black/60 sm:px-6">{order.date}</td>
                  <td className="px-4 py-4 sm:px-6">{order.customer}</td>
                  <td className="px-4 py-4 sm:px-6">
                    <Badge status={order.status} />
                  </td>
                  <td className="px-4 py-4 sm:px-6">{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 text-[10px] uppercase tracking-widest text-brand-black/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Showing 3 of 1,452 orders</span>
          <div className="flex gap-4">
            <button type="button" className="hover:text-brand-black">
              Previous
            </button>
            <button type="button" className="hover:text-brand-black">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
