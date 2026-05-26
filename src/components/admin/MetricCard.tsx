"use client";

import { CountUp } from "@/components/ui/CountUp";

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sub: string;
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  sub,
}: MetricCardProps) {
  return (
    <div className="border border-brand-border bg-brand-white p-6">
      <p className="text-[10px] uppercase tracking-widest text-brand-black/50">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl">
        <CountUp end={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="mt-2 text-xs text-brand-black/50">{sub}</p>
    </div>
  );
}
