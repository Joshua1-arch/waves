"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  initials: string;
  orderCount: number;
  status: "active" | "suspended";
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminCustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomer() {
      setLoading(true);

      try {
        const response = await fetch(`/api/admin/customers/${params.id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error ?? "Unable to fetch customer profile.");
        }

        if (!cancelled) {
          setCustomer(result?.data?.customer ?? null);
          setOrders(Array.isArray(result?.data?.orders) ? result.data.orders : []);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to fetch customer profile.";
          toast.error(message);
          router.replace("/admin/customers");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (params.id) {
      void loadCustomer();
    }

    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  async function handleStatusToggle() {
    if (!customer) {
      return;
    }

    setSubmitting(true);

    try {
      const action = customer.status === "suspended" ? "activate" : "suspend";
      const response = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customerId: customer.id,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to update customer status.");
      }

      setCustomer((current) =>
        current
          ? {
              ...current,
              status: result?.data?.customer?.status ?? current.status,
            }
          : current,
      );

      toast.success(result?.data?.message ?? "Customer updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update customer status.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!customer) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${customer.name}? This will also delete their order history.`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/customers?customerId=${encodeURIComponent(customer.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to delete customer.");
      }

      toast.success(result?.data?.message ?? "Customer deleted successfully.");
      router.replace("/admin/customers");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete customer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-brand-white" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="border border-brand-border bg-brand-white p-8 lg:col-span-1">
            <div className="h-24 w-24 rounded-full bg-brand-cream" />
            <div className="mt-6 h-6 w-40 bg-brand-cream" />
            <div className="mt-3 h-4 w-48 bg-brand-cream" />
          </div>
          <div className="border border-brand-border bg-brand-white p-8 lg:col-span-2">
            <div className="h-6 w-40 bg-brand-cream" />
            <div className="mt-6 h-40 w-full bg-brand-cream" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/customers"
            className="text-xs uppercase tracking-widest text-brand-black/50 hover:text-brand-gold"
          >
            ← Back to Customers
          </Link>
          <h1 className="mt-3 font-serif text-3xl">{customer.name}</h1>
          <p className="mt-1 text-sm text-brand-black/50">{customer.email}</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleStatusToggle}
            disabled={submitting}
          >
            {customer.status === "suspended" ? "Reactivate" : "Suspend"}
          </Button>
          <Button type="button" onClick={handleDelete} disabled={submitting}>
            Delete Customer
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="border border-brand-border bg-brand-white p-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-cream text-lg font-medium uppercase tracking-[0.2em] text-brand-black/70">
            {customer.initials}
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl">Profile</h2>
              <span
                className={`border px-3 py-1 text-[10px] uppercase tracking-widest ${
                  customer.status === "suspended"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {customer.status}
              </span>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                  Full Name
                </dt>
                <dd className="mt-1">{customer.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                  Email
                </dt>
                <dd className="mt-1">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                  Joined
                </dt>
                <dd className="mt-1">{formatDate(customer.joinDate)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-brand-black/50">
                  Total Orders
                </dt>
                <dd className="mt-1">{String(customer.orderCount).padStart(2, "0")}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="border border-brand-border bg-brand-white lg:col-span-2">
          <div className="border-b border-brand-border px-6 py-4">
            <h2 className="font-serif text-2xl">Order History</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-brand-black/60">
              No orders found for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-brand-border align-top">
                      <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-brand-black/60">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-brand-black/70">
                        <ul className="space-y-1">
                          {order.items.map((item, index) => (
                            <li key={`${order.id}-${index}`}>
                              {item.name} × {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={order.status} />
                      </td>
                      <td className="px-6 py-4">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
