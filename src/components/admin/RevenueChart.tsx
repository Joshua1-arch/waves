"use client";

import { revenueChartData } from "@/lib/admin-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={revenueChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.08)" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "rgba(26,26,26,0.5)" }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(26,26,26,0.5)" }}
            tickFormatter={(v) => `$${v / 1000}k`}
          />
          <Bar dataKey="previous" fill="rgba(26,26,26,0.12)" radius={0} />
          <Bar dataKey="current" fill="var(--color-brand-gold)" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
