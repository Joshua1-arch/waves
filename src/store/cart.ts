"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        const existing = get().items.find(
          (i) =>
            i.productId === item.productId &&
            i.color === item.color &&
            i.size === item.size,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId &&
              i.color === item.color &&
              i.size === item.size
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
            isOpen: true,
          });
          return;
        }
        set({
          items: [...get().items, { ...item, quantity }],
          isOpen: true,
        });
      },
      removeItem: (productId, color, size) =>
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.color === color &&
                i.size === size
              ),
          ),
        }),
      updateQuantity: (productId, color, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, size);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.color === color && i.size === size
              ? { ...i, quantity }
              : i,
          ),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    { name: "wave-cart" },
  ),
);

export function useCartTotal() {
  const items = useCartStore((s) => s.items);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
