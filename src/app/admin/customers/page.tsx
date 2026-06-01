"use client";

import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  orderCount: number;
  initials: string;
  status: "active" | "suspended";
}

function formatJoinDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function exportCustomersCsv(customers: CustomerListItem[]) {
  const rows = [
    ["Name", "Email", "Join Date", "Order Count", "Status"],
    ...customers.map((customer) => [
      customer.name,
      customer.email,
      formatJoinDate(customer.joinDate),
      String(customer.orderCount),
      customer.status,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replaceAll("\"", '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "customers.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function LoadingRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index} className="border-b border-brand-border animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cream" />
          <div className="h-4 w-32 bg-brand-cream" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-40 bg-brand-cream" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-brand-cream" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-10 bg-brand-cream" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-brand-cream" />
      </td>
      <td className="px-6 py-4">
        <div className="h-8 w-24 bg-brand-cream" />
      </td>
    </tr>
  ));
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const response = await fetch(
          `/api/admin/customers${params.toString() ? `?${params.toString()}` : ""}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error ?? "Unable to fetch customers.");
        }

        if (!cancelled) {
          setCustomers(
            Array.isArray(result?.data?.customers) ? result.data.customers : [],
          );
        }
      } catch {
        if (!cancelled) {
          setCustomers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const hasCustomers = useMemo(() => customers.length > 0, [customers]);

  async function handleStatusToggle(customer: CustomerListItem) {
    setSubmittingId(customer.id);

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

      setCustomers((current) =>
        current.map((entry) =>
          entry.id === customer.id
            ? {
                ...entry,
                status: result?.data?.customer?.status ?? entry.status,
              }
            : entry,
        ),
      );

      toast.success(result?.data?.message ?? "Customer updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update customer status.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  async function executeDelete(customer: CustomerListItem) {
    setSubmittingId(customer.id);

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

      setCustomers((current) => current.filter((entry) => entry.id !== customer.id));
      toast.success(result?.data?.message ?? "Customer deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete customer.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  function handleDelete(customer: CustomerListItem) {
    toast(`Delete customer "${customer.name}"?`, {
      description: "This will also delete their order history. This cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => void executeDelete(customer),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
      duration: 10000,
    });
  }

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
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search directory"
              className="border border-brand-border py-2 pl-10 pr-4 text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
          </div>
          <Button
            type="button"
            onClick={() => exportCustomersCsv(customers)}
            disabled={!hasCustomers}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export List
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto border border-brand-border bg-brand-white">
        <table className="w-full min-w-[768px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Join Date</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : hasCustomers ? (
              customers.map((customer) => {
                const isSubmitting = submittingId === customer.id;

                return (
                  <tr key={customer.id} className="border-b border-brand-border align-top">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cream text-xs font-medium uppercase tracking-widest text-brand-black/70">
                          {customer.initials}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-black/70">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4">
                      {formatJoinDate(customer.joinDate)}
                    </td>
                    <td className="px-6 py-4">
                      {String(customer.orderCount).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`border px-3 py-1 text-[10px] uppercase tracking-widest ${
                          customer.status === "suspended"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-xs uppercase tracking-widest text-brand-gold underline"
                        >
                          View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleStatusToggle(customer)}
                          disabled={isSubmitting}
                          className="text-xs uppercase tracking-widest text-brand-black/60 underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {customer.status === "suspended" ? "Reactivate" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(customer)}
                          disabled={isSubmitting}
                          className="text-xs uppercase tracking-widest text-red-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-sm text-brand-black/60"
                >
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
