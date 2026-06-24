"use client";

import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function ProductDetail({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.inStock === false;

  return (
    <div className="grid gap-12 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="grid gap-4 md:grid-cols-[80px_1fr]">
          <div className="flex flex-row gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
            {product.images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden border transition-colors md:w-20",
                  activeImage === i
                    ? "border-brand-gold"
                    : "border-brand-border hover:border-brand-black/30",
                )}
              >
                <Image
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
          <div className="relative aspect-square overflow-hidden bg-brand-white">
            <Image
              src={product.images[activeImage]}
              alt={`${product.name} — main product view`}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 60vw"
              priority
            />
            {isOutOfStock ? (
              <div className="absolute left-4 top-4 z-10 border border-red-200 bg-red-600 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
                Out of Stock
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <p className="text-[10px] uppercase tracking-widest text-brand-gold">
          {product.collection ?? "Wave & Co."}
        </p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">{product.name}</h1>
        <p className="mt-4 text-2xl text-brand-gold">
          {formatPrice(product.price)}
        </p>
        {isOutOfStock ? (
          <p className="mt-4 inline-flex border border-red-200 bg-red-50 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-red-700">
            Out of Stock
          </p>
        ) : null}
        <p className="mt-6 text-sm leading-relaxed text-brand-black/70">
          {product.description}
        </p>

        <div className="mt-8">
          <p className="mb-3 text-[10px] uppercase tracking-widest">
            Colour: <span className="font-medium text-brand-black">{color}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full transition-all relative border border-brand-black/10",
                  color === c
                    ? "ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-cream"
                    : "hover:scale-105"
                )}
                style={{ backgroundColor: colorToHex(c) }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-[10px] uppercase tracking-widest">Size</p>
          <div className="flex gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center border text-xs",
                  size === s
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-brand-border",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button
          fullWidth
          className="mt-10"
          disabled={isOutOfStock}
          onClick={() => {
            if (isOutOfStock) {
              return;
            }

            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images[0],
              color,
              size,
            });
          }}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>

        <Link
          href="/shop"
          className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-black/50 transition-colors hover:text-brand-gold"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2} />
          Back to Shop
        </Link>
      </div>
    </div>
  );
}

function colorToHex(color: string): string {
  const map: Record<string, string> = {
    black: "#1a1a1a",
    gold: "#C9A96E",
    white: "#FAF8F5",
    grey: "#9ca3af",
    gray: "#9ca3af",
    silver: "#d1d5db",
    brown: "#92400e",
    tortoise: "#7c3200",
    green: "#065f46",
    blue: "#1e40af",
    red: "#991b1b",
    burgundy: "#881337",
    clear: "#e5e7eb",
    crystal: "#dbeafe",
    rose: "#fda4af",
    nude: "#f5d0a9",
    beige: "#EDE8E3",
  };
  const normalized = color.trim().toLowerCase();
  for (const [key, hex] of Object.entries(map)) {
    if (normalized.includes(key)) return hex;
  }
  return "#EDE8E3";
}
