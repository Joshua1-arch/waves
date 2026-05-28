"use client";

import { ProductCard } from "@/components/shop/ProductCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TaxonomyOption {
  id: string;
  type: "category" | "material";
  name: string;
  slug: string;
  createdAt: string;
}

function formatCategoryLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMaterialLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function getColourClass(colour: string) {
  const normalized = colour.trim().toLowerCase();

  if (normalized.includes("black")) return "bg-brand-black";
  if (normalized.includes("gold")) return "bg-brand-gold";
  if (normalized.includes("white")) return "bg-brand-white border border-brand-border";
  if (normalized.includes("grey") || normalized.includes("gray")) return "bg-brand-black/40";
  if (normalized.includes("silver")) return "bg-zinc-300 border border-brand-border";
  if (normalized.includes("brown") || normalized.includes("tortoise")) return "bg-amber-700";
  if (normalized.includes("green")) return "bg-emerald-700";
  if (normalized.includes("blue")) return "bg-sky-700";
  if (normalized.includes("red") || normalized.includes("burgundy")) return "bg-red-700";

  return "bg-brand-cream border border-brand-border";
}

async function fetchTaxonomies(type: "category" | "material") {
  const response = await fetch(`/api/taxonomies?type=${type}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const result = (await response.json()) as {
    data?: {
      taxonomies?: TaxonomyOption[];
    };
    error?: string;
  };

  if (!response.ok) {
    throw new Error(result.error ?? `Unable to fetch ${type} taxonomies.`);
  }

  return Array.isArray(result.data?.taxonomies) ? result.data.taxonomies : [];
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<TaxonomyOption[]>([]);
  const [materialsData, setMaterialsData] = useState<TaxonomyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [frame, setFrame] = useState<string>("all");
  const [material, setMaterial] = useState<string>("all");
  const [colour, setColour] = useState<string>("all");
  const [priceMax, setPriceMax] = useState(1200);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadShopData() {
      try {
        const [productsResponse, categoryTaxonomies, materialTaxonomies] = await Promise.all([
          fetch("/api/products", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetchTaxonomies("category"),
          fetchTaxonomies("material"),
        ]);

        const result = (await productsResponse.json()) as {
          data?: {
            products?: Product[];
          };
          error?: string;
        };

        if (!productsResponse.ok) {
          throw new Error(result.error ?? "Unable to fetch products.");
        }

        if (!cancelled) {
          setProducts(Array.isArray(result.data?.products) ? result.data.products : []);
          setCategories(categoryTaxonomies);
          setMaterialsData(materialTaxonomies);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCategories([]);
          setMaterialsData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadShopData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!filtersOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  const frameTypes = useMemo(
    () => [
      { label: "All", value: "all" },
      ...categories.map((taxonomy) => ({
        label: formatCategoryLabel(taxonomy.name),
        value: taxonomy.name,
      })),
    ],
    [categories],
  );

  const materials = useMemo(
    () => [
      { label: "All", value: "all" },
      ...materialsData.map((taxonomy) => ({
        label: formatMaterialLabel(taxonomy.name),
        value: taxonomy.name,
      })),
    ],
    [materialsData],
  );

  const colours = useMemo(
    () => [
      { label: "All", value: "all" },
      ...Array.from(
        new Set(products.flatMap((product) => product.colors.map((color) => color.trim())).filter(Boolean)),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ label: value, value })),
    ],
    [products],
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (frame !== "all" && p.category !== frame) return false;
        if (material !== "all" && p.material !== material) return false;
        if (colour !== "all" && !p.colors.some((entry) => entry.toLowerCase() === colour.toLowerCase())) {
          return false;
        }
        if (p.price > priceMax) return false;
        return true;
      }),
    [colour, frame, material, priceMax, products],
  );

  const activeFilterCount = [frame, material, colour].filter((value) => value !== "all").length + (priceMax < 1200 ? 1 : 0);

  const resetFilters = () => {
    setFrame("all");
    setMaterial("all");
    setColour("all");
    setPriceMax(1200);
  };

  const closeFilters = () => setFiltersOpen(false);

  const filtersContent = (
    <div className="space-y-8 lg:space-y-10">
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-widest">Frame Type</p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[10px] uppercase tracking-widest text-brand-black/55 transition-colors hover:text-brand-black lg:hidden"
          >
            Reset
          </button>
        </div>
        <ul className="space-y-2">
          {frameTypes.map((t) => (
            <li key={t.value}>
              <button
                type="button"
                onClick={() => setFrame(t.value)}
                className={cn(
                  "flex min-h-11 items-center text-left text-sm transition-colors",
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
        <p className="mb-4 text-[10px] uppercase tracking-widest">Material</p>
        <ul className="space-y-2">
          {materials.map((m) => (
            <li key={m.value}>
              <button
                type="button"
                onClick={() => setMaterial(m.value)}
                className={cn(
                  "flex min-h-11 items-center text-left text-sm transition-colors",
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
        <p className="mb-4 text-[10px] uppercase tracking-widest">Colour</p>
        <div className="flex flex-wrap gap-3">
          {colours.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-label={s.label}
              onClick={() => setColour(s.value)}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                getColourClass(s.label),
                colour === s.value ? "ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-cream" : "",
              )}
              title={s.label}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-[10px] uppercase tracking-widest">Price Range</p>
        <input
          type="range"
          min={200}
          max={1200}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-brand-gold"
        />
        <div className="mt-2 flex justify-between gap-4 text-xs text-brand-black/50">
          <span>$200</span>
          <span>${priceMax}+</span>
        </div>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="hidden text-xs uppercase tracking-widest text-brand-black/55 transition-colors hover:text-brand-black lg:inline-flex"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <PageTransition>
      <div className="section-shell section-space overflow-x-hidden pt-28">
        <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 border border-brand-border bg-brand-white px-4 py-3 text-xs uppercase tracking-widest"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Filters
            {activeFilterCount > 0 ? <span>({activeFilterCount})</span> : null}
          </button>
          <p className="text-right text-xs text-brand-black/50">
            {loading ? "Loading..." : `${filtered.length} items`}
          </p>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="hidden w-full shrink-0 lg:block lg:w-56">
            {filtersContent}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-10 hidden items-end justify-end lg:flex">
              <p className="text-xs text-brand-black/50">
                {loading ? "Loading..." : `${filtered.length} items`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-square bg-brand-white" />
                    <div className="mt-4 h-4 bg-brand-white" />
                    <div className="mt-2 h-4 w-24 bg-brand-white" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="border border-brand-border bg-brand-white px-6 py-14 text-center sm:px-8 sm:py-16">
                <p className="font-serif text-2xl">No products available</p>
                <p className="mt-3 text-sm leading-relaxed text-brand-black/60">
                  Try adjusting your filters or add products to MongoDB.
                </p>
              </div>
            ) : (
              <div className="eyewear-grid">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-brand-black/45 lg:hidden">
          <div className="absolute inset-0" onClick={closeFilters} aria-hidden="true" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-hidden bg-brand-cream shadow-[-20px_0_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-black/60">
                  Refine Selection
                </p>
                <p className="mt-1 font-serif text-2xl">Filters</p>
              </div>
              <button
                type="button"
                aria-label="Close filters"
                onClick={closeFilters}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-brand-white"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{filtersContent}</div>
            <div className="border-t border-brand-border bg-brand-white px-6 py-4">
              <button
                type="button"
                onClick={closeFilters}
                className="inline-flex min-h-11 w-full items-center justify-center bg-brand-black px-6 py-3 text-xs font-medium uppercase tracking-widest text-brand-white"
              >
                View {filtered.length} {filtered.length === 1 ? "Item" : "Items"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </PageTransition>
  );
}
