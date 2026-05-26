"use client";

import { ProductCard } from "@/components/shop/ProductCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { products } from "@/lib/products";
import { cn } from "@/lib/utils";
import type { ProductCategory, ProductMaterial } from "@/lib/types";
import { useMemo, useState } from "react";

const frameTypes: { label: string; value: ProductCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Aviator", value: "aviator" },
  { label: "Rectangular", value: "rectangular" },
  { label: "Round", value: "round" },
  { label: "Cat Eye", value: "cat-eye" },
];

const materials: { label: string; value: ProductMaterial | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Titanium", value: "titanium" },
  { label: "Bio-Acetate", value: "bio-acetate" },
  { label: "Gold-Plated", value: "gold-plated" },
];

const swatches = [
  { color: "bg-brand-black", label: "Black" },
  { color: "bg-brand-gold", label: "Gold" },
  { color: "bg-brand-white border border-brand-border", label: "White" },
  { color: "bg-brand-black/40", label: "Grey" },
];

export default function ShopPage() {
  const [frame, setFrame] = useState<ProductCategory | "all">("all");
  const [material, setMaterial] = useState<ProductMaterial | "all">("all");
  const [priceMax, setPriceMax] = useState(1200);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (frame !== "all" && p.category !== frame) return false;
        if (material !== "all" && p.material !== material) return false;
        if (p.price > priceMax) return false;
        return true;
      }),
    [frame, material, priceMax],
  );

  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <div className="space-y-10">
              <div>
                <p className="mb-4 text-[10px] uppercase tracking-widest">
                  Frame Type
                </p>
                <ul className="space-y-2">
                  {frameTypes.map((t) => (
                    <li key={t.value}>
                      <button
                        type="button"
                        onClick={() => setFrame(t.value)}
                        className={cn(
                          "text-sm transition-colors",
                          frame === t.value
                            ? "text-brand-gold"
                            : "text-brand-black/60 hover:text-brand-black",
                        )}
                      >
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-4 text-[10px] uppercase tracking-widest">
                  Material
                </p>
                <ul className="space-y-2">
                  {materials.map((m) => (
                    <li key={m.value}>
                      <button
                        type="button"
                        onClick={() => setMaterial(m.value)}
                        className={cn(
                          "text-sm transition-colors",
                          material === m.value
                            ? "text-brand-gold"
                            : "text-brand-black/60 hover:text-brand-black",
                        )}
                      >
                        {m.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-4 text-[10px] uppercase tracking-widest">
                  Colour
                </p>
                <div className="flex gap-3">
                  {swatches.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      aria-label={s.label}
                      className={cn("h-6 w-6 rounded-full", s.color)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-4 text-[10px] uppercase tracking-widest">
                  Price Range
                </p>
                <input
                  type="range"
                  min={200}
                  max={1200}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-brand-gold"
                />
                <div className="mt-2 flex justify-between text-xs text-brand-black/50">
                  <span>$200</span>
                  <span>${priceMax}+</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-10 flex items-end justify-between">
              <h1 className="font-serif text-3xl md:text-4xl">
                The 2024 Collection
              </h1>
              <p className="text-xs text-brand-black/50">
                {filtered.length} items
              </p>
            </div>
            <div className="eyewear-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
