"use client";

import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatPrice } from "@/lib/utils";
import { useCartStore, useCartTotal } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const total = useCartTotal();

  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <h1 className="font-serif text-4xl">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-brand-black/60">Your cart is empty.</p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-3">
            <ul className="space-y-8 lg:col-span-2">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.color}-${item.size}`}
                  className="flex gap-6 border-b border-brand-border pb-8"
                >
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-brand-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-serif text-lg">{item.name}</h2>
                    <p className="mt-1 text-xs text-brand-black/50">
                      {item.color} · Size {item.size}
                    </p>
                    <p className="mt-2 text-brand-gold">
                      {formatPrice(item.price)}
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <label className="text-[10px] uppercase tracking-widest">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            item.color,
                            item.size,
                            Number(e.target.value),
                          )
                        }
                        className="w-16 border border-brand-border px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        className="text-[10px] uppercase tracking-widest text-brand-gold"
                        onClick={() =>
                          removeItem(item.productId, item.color, item.size)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-serif text-lg">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border border-brand-border bg-brand-white p-8">
              <h2 className="font-serif text-xl">Order Summary</h2>
              <div className="mt-6 space-y-3 text-sm">
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
              </div>
              <div className="mt-6 flex justify-between border-t border-brand-border pt-6">
                <span className="font-serif text-lg">Total</span>
                <span className="font-serif text-2xl text-brand-gold">
                  {formatPrice(total)}
                </span>
              </div>
              <Link href="/checkout" className="mt-8 block">
                <Button fullWidth>Proceed to Checkout</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
