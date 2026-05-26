import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  processing: "bg-brand-gold/20 text-brand-black",
  shipped: "bg-brand-black/10 text-brand-black",
  delivered: "bg-brand-black text-brand-white",
  cancelled: "border border-red-500/60 text-red-600 bg-transparent",
};

interface BadgeProps {
  status: OrderStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-3 py-1 text-[10px] font-medium uppercase tracking-widest",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
