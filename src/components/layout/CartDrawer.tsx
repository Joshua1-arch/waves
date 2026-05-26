"use client";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { useCartStore, useCartTotal } from "@/store/cart";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem } =
    useCartStore();
  const total = useCartTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-brand-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-brand-white shadow-card"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
              <h2 className="font-serif text-xl">Your Cart</h2>
              <button type="button" onClick={closeCart} aria-label="Close cart">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <p className="py-12 text-center text-sm text-brand-black/60">
                  Your cart is empty.
                </p>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li
                      key={`${item.productId}-${item.color}-${item.size}`}
                      className="flex gap-4"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-brand-cream">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-brand-black/50">
                          {item.color} · {item.size}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.color,
                                item.size,
                                item.quantity - 1,
                              )
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.color,
                                item.size,
                                item.quantity + 1,
                              )
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="mt-1 text-[10px] uppercase tracking-widest text-brand-gold"
                          onClick={() =>
                            removeItem(item.productId, item.color, item.size)
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-brand-gold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-brand-border px-6 py-6">
                <div className="mb-4 flex justify-between text-sm">
                  <span className="uppercase tracking-widest">Total</span>
                  <span className="font-serif text-lg text-brand-gold">
                    {formatPrice(total)}
                  </span>
                </div>
                <Link href="/checkout" onClick={closeCart}>
                  <Button fullWidth>Checkout</Button>
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
