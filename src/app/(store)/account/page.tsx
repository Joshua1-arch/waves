"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";
import { cn, formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AccountOrder {
  id: string;
  orderId: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
}

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "orders", label: "Order History" },
] as const;

export default function AccountPage() {
  const router = useRouter();
  const { user, initialized } = useUser();
  const setUser = useAuthStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get("tab") === "orders" ? "orders" : "profile");
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  useEffect(() => {
    if (!initialized || !user) {
      return;
    }

    const loadOrders = async () => {
      setOrdersLoading(true);

      try {
        const response = await fetch(`/api/orders?userId=${user.id}`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          setOrders([]);
          return;
        }

        setOrders(result.data.orders);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    void loadOrders();
  }, [initialized, user]);

  const joinedDate = user?.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(user.createdAt))
    : "—";

  const changeTab = (tab: "profile" | "orders") => {
    setActiveTab(tab);
    router.replace(tab === "orders" ? "/account?tab=orders" : "/account");
  };

  const handleSave = async () => {
    setProfileError("");

    if (draftName.trim().length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: draftName.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setProfileError(result.error || "Unable to update profile.");
        return;
      }

      setUser(result.data.user);
      setEditing(false);
      setDraftName("");
      toast.success("Profile updated successfully.");
    } catch {
      setProfileError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!initialized || !user) {
    return (
      <div className="section-shell py-32">
        <p className="text-sm text-brand-black/60">Loading your account...</p>
      </div>
    );
  }

  const nameValue = editing ? draftName : user.name;

  return (
    <div className="bg-brand-cream pb-20 pt-28">
      <section className="section-shell">
        <div className="border border-brand-border bg-brand-white">
          <div className="border-b border-brand-border px-8 py-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-black/45">
              My Account
            </p>
            <h1 className="mt-3 font-serif text-3xl">{user.name}</h1>
            <p className="mt-2 text-sm text-brand-black/60">
              Manage your profile and review your orders.
            </p>
          </div>

          <div className="flex border-b border-brand-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeTab(tab.id)}
                className={cn(
                  "border-r border-brand-border px-6 py-4 text-[10px] uppercase tracking-[0.25em] transition-colors last:border-r-0",
                  activeTab === tab.id
                    ? "bg-brand-black text-brand-white"
                    : "bg-brand-white text-brand-black/60 hover:text-brand-black",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" ? (
            <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="border border-brand-border px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                    Full Name
                  </p>
                  {editing ? (
                    <input
                      value={nameValue}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="mt-4 w-full border-b border-brand-border bg-transparent pb-2 text-base outline-none focus:border-brand-gold"
                    />
                  ) : (
                    <p className="mt-4 text-base">{user.name}</p>
                  )}
                </div>
                <div className="border border-brand-border px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                    Email
                  </p>
                  <p className="mt-4 text-base">{user.email}</p>
                </div>
                <div className="border border-brand-border px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                    Date Joined
                  </p>
                  <p className="mt-4 text-base">{joinedDate}</p>
                </div>
                {profileError && (
                  <p className="text-sm text-red-600">{profileError}</p>
                )}
              </div>

              <div className="border border-brand-border px-6 py-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                  Profile Actions
                </p>
                <p className="mt-4 text-sm leading-7 text-brand-black/60">
                  Keep your personal details current for a more seamless checkout
                  and post-purchase experience.
                </p>
                <div className="mt-8 flex gap-3">
                  {editing ? (
                    <>
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          setDraftName("");
                          setProfileError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setDraftName(user.name);
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-8 py-10">
              {ordersLoading ? (
                <p className="text-sm text-brand-black/60">
                  Loading order history...
                </p>
              ) : orders.length === 0 ? (
                <div className="border border-brand-border px-8 py-12 text-center">
                  <p className="font-serif text-2xl">
                    {"You haven't placed any orders yet."}
                  </p>
                  <Link
                    href="/shop"
                    className="mt-6 inline-flex items-center justify-center bg-brand-black px-8 py-3 text-xs font-medium uppercase tracking-widest text-brand-white transition-all duration-300 hover:bg-brand-black/90"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-brand-border px-6 py-6"
                    >
                      <div className="flex flex-col gap-4 border-b border-brand-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                            Order ID
                          </p>
                          <p className="mt-2 font-medium">{order.orderId}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                            Status
                          </p>
                          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-brand-black">
                            {order.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto_auto]">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                            Items Ordered
                          </p>
                          <div className="mt-3 space-y-2 text-sm text-brand-black/70">
                            {order.items.map((item, index) => (
                              <p key={`${order.id}-${index}`}>
                                {item.name} × {item.quantity}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                            Date
                          </p>
                          <p className="mt-3 text-sm text-brand-black/70">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(new Date(order.date))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-black/45">
                            Total
                          </p>
                          <p className="mt-3 text-sm text-brand-black/70">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
