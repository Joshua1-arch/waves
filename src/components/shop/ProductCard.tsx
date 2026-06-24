"use client";

import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.inStock === false;

  /* ── Image swap on hover ─────────────────────────────────────────── */
  const [hovered, setHovered] = useState(false);
  const primaryImage = product.images[0];
  const hoverImage = product.images[1] ?? product.images[0];
  const hasSecondImage = hoverImage !== primaryImage;

  /* ── Active colour swatch ────────────────────────────────────────── */
  const [activeColor, setActiveColor] = useState(product.colors[0] ?? "");

  /* ── Cursor-aware 3-D tilt (desktop only — no-op on touch) ──────── */
  const cardRef = useRef<HTMLElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springCfg = { stiffness: 200, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [6, -6]), springCfg);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-6, 6]), springCfg);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      rawX.set((e.clientX - rect.left) / rect.width - 0.5);
      rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [rawX, rawY],
  );

  const resetTilt = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  /* ── Quick Add ───────────────────────────────────────────────────── */
  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isOutOfStock) return;
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0],
        color: activeColor || product.colors[0],
        size: product.sizes[0],
      });
      toast.success(`${product.name} added to cart`);
    },
    [addItem, activeColor, isOutOfStock, product],
  );

  return (
    <motion.article
      ref={cardRef}
      className="group relative min-w-0"
      /* Tilt only takes effect when a pointer (mouse) is in use */
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: (index % 4) * 0.09,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { resetTilt(); setHovered(false); }}
    >
      <Link href={`/shop/${product.slug}`} className="block">
        {/* ── Image container ─────────────────────────────────────── */}
        <div className="relative aspect-square overflow-hidden bg-brand-white">

          {/* Primary image */}
          <Image
            src={primaryImage}
            alt={`${product.name} — Wave & Co. architectural eyewear`}
            fill
            className={`object-cover transition-all duration-500 ${
              hovered && hasSecondImage
                ? "scale-105 opacity-0"
                : "scale-100 opacity-100"
            }`}
            sizes="(max-width:640px) 50vw, (max-width:1280px) 33vw, 25vw"
          />

          {/* Hover / lifestyle image */}
          {hasSecondImage && (
            <Image
              src={hoverImage}
              alt={`${product.name} — alternate view`}
              fill
              className={`absolute inset-0 object-cover transition-all duration-500 ${
                hovered ? "scale-100 opacity-100" : "scale-105 opacity-0"
              }`}
              sizes="(max-width:640px) 50vw, (max-width:1280px) 33vw, 25vw"
            />
          )}

          {/* Subtle light sheen on hover */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%)",
            }}
          />

          {/* Badges — top-left */}
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
            {isOutOfStock && (
              <span className="inline-block border border-red-300/40 bg-red-600/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white">
                Out of Stock
              </span>
            )}
            {product.salePrice && !isOutOfStock && (
              <span className="inline-block bg-brand-gold px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-brand-black">
                Sale
              </span>
            )}
          </div>

          {/* Quick Add bar
              Mobile (< sm): always visible at the bottom (no hover state).
              Desktop (sm+): hidden by default, slides up on group-hover. */}
          <div
            className={[
              "absolute inset-x-0 bottom-0 bg-brand-black/85 p-2.5 backdrop-blur-sm",
              "transition-transform duration-300",
              /* Mobile: always shown */
              "translate-y-0",
              /* Desktop: hide until hover */
              "sm:translate-y-full sm:group-hover:translate-y-0",
            ].join(" ")}
          >
            <Button
              variant="gold"
              fullWidth
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
            >
              {isOutOfStock ? "Sold Out" : "Quick Add"}
            </Button>
          </div>
        </div>

        {/* ── Info row ────────────────────────────────────────────── */}
        <div className="mt-3 px-0.5">
          {/* Name — single line on small screens, allow wrap on larger */}
          <h3 className="truncate text-[11px] uppercase tracking-widest text-brand-black sm:whitespace-normal sm:break-words">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-medium text-brand-gold">
              {formatPrice(product.salePrice ?? product.price)}
            </p>
            {product.salePrice && (
              <p className="text-xs text-brand-black/40 line-through">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          {/* Clickable colour swatches
              Touch-friendly: the visible dot is small, but the <button> has
              a larger minimum hit-area via padding. */}
          {product.colors.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {product.colors.slice(0, 6).map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={color}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveColor(color);
                  }}
                  /* The button is the touch target (min 28px²);
                     the visible dot is a smaller inner element */
                  className="flex h-6 w-6 items-center justify-center sm:h-5 sm:w-5"
                >
                  <span
                    className={[
                      "block h-3 w-3 rounded-full border transition-all duration-150",
                      activeColor === color
                        ? "scale-125 border-brand-gold ring-1 ring-brand-gold ring-offset-1"
                        : "border-brand-black/15 hover:scale-110",
                    ].join(" ")}
                    style={{ backgroundColor: colorToHex(color) }}
                  />
                </button>
              ))}
              {product.colors.length > 6 && (
                <span className="text-[9px] text-brand-black/40">
                  +{product.colors.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
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
    bronze: "#cd7f32",
    olive: "#556b2f",
    amber: "#b45309",
  };
  const n = color.trim().toLowerCase();
  for (const [key, hex] of Object.entries(map)) {
    if (n.includes(key)) return hex;
  }
  return "#EDE8E3";
}
