"use client";

import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
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
          <div className="flex flex-row gap-2 md:flex-col">
            {product.images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative aspect-square w-16 overflow-hidden border md:w-20",
                  activeImage === i
                    ? "border-brand-gold"
                    : "border-brand-border",
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
        <h1 className="mt-2 font-serif text-4xl">{product.name}</h1>
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
          <p className="mb-3 text-[10px] uppercase tracking-widest">Colour</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "border px-4 py-2 text-xs uppercase tracking-wider",
                  color === c
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-brand-border",
                )}
              >
                {c}
              </button>
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
          className="mt-4 block text-center text-xs uppercase tracking-widest text-brand-black/50 hover:text-brand-gold"
        >
          ← Back to Shop
        </Link>
      </div>
    </div>
  );
}
