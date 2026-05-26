"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatPrice } from "@/lib/utils";
import { useCartStore, useCartTotal } from "@/store/cart";
import { Lock, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const total = useCartTotal();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    router.push("/");
  };

  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <div className="mb-8 flex items-center justify-between">
          <nav className="text-[10px] uppercase tracking-widest text-brand-black/40">
            <Link href="/cart">Cart</Link>
            <span className="mx-2">›</span>
            <span className="text-brand-black">Shipping</span>
            <span className="mx-2">›</span>
            <span>Payment</span>
            <span className="mx-2">›</span>
            <span>Confirmation</span>
          </nav>
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Lock className="h-3 w-3" /> Secure Checkout
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-12 lg:grid-cols-5"
        >
          <div className="space-y-12 lg:col-span-3">
            <section>
              <h2 className="font-serif text-2xl">Shipping Details</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Input label="First Name" name="firstName" required />
                <Input label="Last Name" name="lastName" required />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  className="sm:col-span-2"
                  required
                />
                <Input
                  label="Street Address"
                  name="address"
                  className="sm:col-span-2"
                  required
                />
                <Input label="City" name="city" required />
                <Input label="Zip Code" name="zip" required />
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl">Payment Method</h2>
              <div className="mt-6 space-y-6">
                <label className="flex items-center gap-3 text-xs uppercase tracking-widest">
                  <input type="radio" name="payment" defaultChecked />
                  Credit Card
                </label>
                <Input label="Card Number" name="card" required />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Input label="Exp (MM/YY)" name="exp" required />
                  <Input label="CVV" name="cvv" required />
                </div>
              </div>
            </section>

            <Button type="submit" fullWidth>
              Complete Purchase — {formatPrice(total)}
            </Button>
          </div>

          <aside className="border border-brand-border bg-brand-white p-8 lg:col-span-2">
            <h2 className="font-serif text-xl">Order Summary</h2>
            <ul className="mt-6 space-y-6">
              {items.map((item) => (
                <li key={`${item.productId}-${item.color}`} className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-brand-cream">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium uppercase tracking-wider">
                      {item.name}
                    </p>
                    <p className="text-brand-black/50">
                      {item.color} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-brand-gold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-2 border-t border-brand-border pt-6 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="uppercase tracking-widest text-brand-gold">
                  Complimentary
                </span>
              </div>
              <div className="flex justify-between pt-4 font-serif text-xl">
                <span>Total</span>
                <span className="text-brand-gold">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3 border border-brand-border p-4 text-xs text-brand-black/60">
              <Shield className="h-4 w-4 shrink-0 text-brand-gold" />
              <p>
                256-bit SSL encryption. 30-day structural guarantee on all
                frames.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </PageTransition>
  );
}
