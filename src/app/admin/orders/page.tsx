"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice, cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Download, Search, User } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

const filters: Array<OrderStatus | "all"> = [
  "all",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Array<{
    id: string;
    customer: string;
    email: string;
    date: string;
    items: number;
    itemsList?: Array<{ name: string; quantity: number }>;
    total: number;
    status: OrderStatus;
    shippingAddress?: {
      name: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      state: string;
      country: string;
    };
    shippingCost?: number;
    shippingCourier?: string;
    shippingOptionId?: string;
    shipmentId?: string;
    trackingCode?: string;
    paymentReference?: string;
    paymentStatus?: "initiated" | "success" | "failed";
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<typeof orders[0] | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleBookShipment = async (orderNumber: string) => {
    setBookingLoading(true);
    try {
      const response = await fetch("/api/admin/orders/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber })
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to book shipment");
      }
      
      toast.success("Shipment booked successfully!");
      
      // Update local state for the updated order
      const updatedOrders = orders.map(o => {
        if (o.id === orderNumber) {
          return {
            ...o,
            shipmentId: resData.data.shipmentId,
            trackingCode: resData.data.trackingCode,
            status: "shipped" as OrderStatus
          };
        }
        return o;
      });
      
      setOrders(updatedOrders);
      
      // Update selected order details view if open
      if (selected && selected.id === orderNumber) {
        setSelected({
          ...selected,
          shipmentId: resData.data.shipmentId,
          trackingCode: resData.data.trackingCode,
          status: "shipped" as OrderStatus
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not book shipment");
    } finally {
      setBookingLoading(false);
    }
  };

  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleUpdateStatus = async (orderNumber: string, nextStatus: OrderStatus) => {
    setStatusUpdating(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status: nextStatus })
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to update order status");
      }
      
      toast.success(`Order status updated to ${nextStatus}`);
      
      // Update local state
      const updatedOrders = orders.map(o => {
        if (o.id === orderNumber) {
          return { ...o, status: nextStatus };
        }
        return o;
      });
      setOrders(updatedOrders);
      
      if (selected && selected.id === orderNumber) {
        setSelected({ ...selected, status: nextStatus });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await fetch("/api/admin/orders", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const result = (await response.json()) as {
          data?: {
            orders?: typeof orders;
          };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to fetch orders.");
        }

        if (!cancelled) {
          setOrders(Array.isArray(result.data?.orders) ? result.data.orders : []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to fetch orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = status === "all" || o.status === status;
      const matchesSearch =
        !searchInput ||
        o.id.toLowerCase().includes(searchInput.toLowerCase()) ||
        o.customer.toLowerCase().includes(searchInput.toLowerCase()) ||
        o.email.toLowerCase().includes(searchInput.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, status, searchInput]);

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl">Order Manager</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/40" />
            <input
              type="search"
              placeholder="Search orders..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-brand-border py-2 pl-10 pr-4 text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
          </div>
          <button type="button" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Profile">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={cn(
                "px-4 py-2 text-[10px] uppercase tracking-widest transition-colors",
                status === f
                  ? "bg-brand-black text-brand-white"
                  : "border border-brand-border hover:border-brand-gold",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <select className="border border-brand-border px-4 py-2 text-xs uppercase tracking-widest">
            <option>Last 30 Days</option>
          </select>
          <Button className="flex items-center gap-2">
            <Download className="h-3 w-3" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="relative mt-8 overflow-x-auto border border-brand-border bg-brand-white">
        <table className="w-full min-w-[768px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-brand-black/50">
                  Loading orders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-brand-black/50">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer border-b border-brand-border hover:bg-brand-cream/50"
                  onClick={() => setSelected(order)}
                >
                  <td className="px-6 py-4 font-medium">{order.id}</td>
                  <td className="px-6 py-4">
                    <p>{order.customer}</p>
                    <p className="text-xs text-brand-black/50">{order.email}</p>
                  </td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">
                    {String(order.items).padStart(2, "0")}
                  </td>
                  <td className="px-6 py-4">{formatPrice(order.total)}</td>
                  <td className="px-6 py-4">
                    <Badge status={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-brand-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-[60] h-full w-full max-w-md overflow-y-auto bg-brand-white p-8 shadow-card"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="font-serif text-2xl">Order {selected.id}</h2>
              <dl className="mt-8 space-y-5 text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Customer
                  </dt>
                  <dd className="mt-1 font-medium">{selected.customer}</dd>
                  <dd className="text-xs text-brand-black/60">{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Date
                  </dt>
                  <dd className="mt-1">{selected.date}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Status
                  </dt>
                  <dd className="mt-2">
                    <Badge status={selected.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Total Amount
                  </dt>
                  <dd className="mt-1 font-serif text-xl text-brand-gold">
                    {formatPrice(selected.total)}
                  </dd>
                </div>

                <div className="border-t border-brand-border/60 pt-4">
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Items Ordered
                  </dt>
                  <dd className="mt-2 space-y-1.5">
                    {selected.itemsList && selected.itemsList.length > 0 ? (
                      selected.itemsList.map((item, idx) => (
                        <p key={idx} className="text-xs text-brand-black/85">
                          {item.name} <span className="text-brand-black/45">× {item.quantity}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-brand-black/45 italic">No item details available</p>
                    )}
                  </dd>
                </div>

                <div className="border-t border-brand-border/60 pt-4">
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Shipping Address
                  </dt>
                  <dd className="mt-2 text-xs leading-5 text-brand-black/80">
                    {selected.shippingAddress ? (
                      <>
                        <p className="font-semibold text-brand-black">{selected.shippingAddress.name}</p>
                        <p>{selected.shippingAddress.address}</p>
                        <p>{selected.shippingAddress.city}, {selected.shippingAddress.state}, {selected.shippingAddress.country}</p>
                        <p className="mt-1 text-brand-black/45">Phone: {selected.shippingAddress.phone}</p>
                      </>
                    ) : (
                      <p className="italic text-brand-black/45">No address recorded</p>
                    )}
                  </dd>
                </div>

                <div className="border-t border-brand-border/60 pt-4">
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Logistics & Shipbubble
                  </dt>
                  <dd className="mt-2 space-y-2">
                    <p className="text-xs text-brand-black/80">
                      Courier: <span className="font-medium text-brand-black">{selected.shippingCourier || "Standard Courier"}</span>
                    </p>
                    {selected.trackingCode ? (
                      <>
                        <p className="text-xs text-brand-black/85">
                          Shipment ID: <span className="font-mono text-brand-black">{selected.shipmentId}</span>
                        </p>
                        <p className="text-xs text-brand-black/85">
                          Tracking Code: <span className="font-mono text-brand-black font-semibold">{selected.trackingCode}</span>
                        </p>
                        <div className="mt-3">
                          <a
                            href={`https://trackshipment.shipbubble.com/shipment/${selected.trackingCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-brand-black hover:bg-brand-black/90 text-brand-white px-4 py-2 text-[10px] uppercase tracking-wider transition-colors duration-300"
                          >
                            Track on Shipbubble
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-amber-600 font-medium">
                          Shipment has not been booked with Shipbubble.
                        </p>
                        {selected.paymentStatus === "success" ? (
                          <Button
                            type="button"
                            disabled={bookingLoading}
                            onClick={() => handleBookShipment(selected.id)}
                            className="w-full text-[10px] py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-white uppercase tracking-wider"
                          >
                            {bookingLoading ? "Booking Shipment..." : "Book Shipment via Shipbubble"}
                          </Button>
                        ) : (
                          <p className="text-xs text-brand-black/45 italic">
                            Awaiting payment confirmation to enable booking.
                          </p>
                        )}
                      </div>
                    )}
                  </dd>
                </div>

                <div className="border-t border-brand-border/60 pt-4">
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Payment Details
                  </dt>
                  <dd className="mt-2 space-y-1 text-xs">
                    <p className="text-brand-black/85">
                      Status: <span className={cn(
                        "font-semibold uppercase tracking-wider",
                        selected.paymentStatus === "success" ? "text-emerald-600" : "text-amber-600"
                      )}>{selected.paymentStatus || "pending"}</span>
                    </p>
                    {selected.paymentReference && (
                      <p className="text-brand-black/60">
                        Reference: <span className="font-mono">{selected.paymentReference}</span>
                      </p>
                    )}
                  </dd>
                </div>

                <div className="border-t border-brand-border/60 pt-4">
                  <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Update Order Status
                  </dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {["processing", "shipped", "delivered", "cancelled"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={statusUpdating}
                        onClick={() => handleUpdateStatus(selected.id, s as OrderStatus)}
                        className={cn(
                          "px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors",
                          selected.status === s
                            ? "bg-brand-black text-brand-white"
                            : "border border-brand-border hover:border-brand-gold text-brand-black/70 hover:text-brand-black"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </dd>
                </div>
              </dl>
              <Button className="mt-8" onClick={() => setSelected(null)}>
                Close
              </Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
