"use client";

import { ProductCard } from "@/components/shop/ProductCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ─── Types ───────────────────────────────────────────────────────────── */
interface TaxonomyOption {
  id: string;
  type: "category" | "material";
  name: string;
  slug: string;
  createdAt: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmtLabel(value: string) {
  return value
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function colourClass(colour: string) {
  const n = colour.trim().toLowerCase();
  if (n.includes("black")) return "bg-brand-black";
  if (n.includes("gold")) return "bg-brand-gold";
  if (n.includes("white")) return "bg-brand-white border border-brand-border";
  if (n.includes("grey") || n.includes("gray")) return "bg-brand-black/40";
  if (n.includes("silver")) return "bg-zinc-300 border border-brand-border";
  if (n.includes("brown") || n.includes("tortoise")) return "bg-amber-700";
  if (n.includes("green")) return "bg-emerald-700";
  if (n.includes("blue")) return "bg-sky-700";
  if (n.includes("red") || n.includes("burgundy")) return "bg-red-700";
  return "bg-brand-cream border border-brand-border";
}

async function fetchTaxonomies(type: "category" | "material") {
  const r = await fetch(`/api/taxonomies?type=${type}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const json = (await r.json()) as {
    data?: { taxonomies?: TaxonomyOption[] };
    error?: string;
  };
  if (!r.ok) throw new Error(json.error ?? `Could not load ${type}`);
  return Array.isArray(json.data?.taxonomies) ? json.data.taxonomies : [];
}

/* ─── Skeleton card ───────────────────────────────────────────────────── */
function SkeletonCard({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: i * 0.04 }}
      className="min-w-0"
    >
      <div className="shimmer aspect-square w-full" />
      <div className="mt-3.5 space-y-2">
        <div className="shimmer h-3 w-3/4" />
        <div className="shimmer h-3 w-1/3" />
        <div className="flex gap-1.5 pt-0.5">
          {[0, 1, 2].map((d) => (
            <div key={d} className="shimmer h-3 w-3 rounded-full" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<TaxonomyOption[]>([]);
  const [materialsData, setMaterialsData] = useState<TaxonomyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [frame, setFrame] = useState("all");
  const [material, setMaterial] = useState("all");
  const [colour, setColour] = useState("all");
  const [priceMax, setPriceMax] = useState(5_000_000);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  /* Load data */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pr, cats, mats] = await Promise.all([
          fetch("/api/products", { credentials: "same-origin", cache: "no-store" }),
          fetchTaxonomies("category"),
          fetchTaxonomies("material"),
        ]);
        const json = (await pr.json()) as {
          data?: { products?: Product[] };
          error?: string;
        };
        if (!pr.ok) throw new Error(json.error ?? "Could not load products");
        if (!cancelled) {
          const list = Array.isArray(json.data?.products) ? json.data.products : [];
          setProducts(list);
          setCategories(cats);
          setMaterialsData(mats);
          if (list.length > 0) {
            const max = Math.max(...list.map((p) => p.price));
            setPriceMax(Math.ceil(max / 100_000) * 100_000);
          }
        }
      } catch {
        if (!cancelled) { setProducts([]); setCategories([]); setMaterialsData([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Lock scroll when mobile filter open */
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [filtersOpen]);

  /* Derived filter options */
  const frameTypes = useMemo(
    () => [{ label: "All", value: "all" }, ...categories.map((c) => ({ label: fmtLabel(c.name), value: c.name }))],
    [categories],
  );
  const materials = useMemo(
    () => [{ label: "All", value: "all" }, ...materialsData.map((m) => ({ label: fmtLabel(m.name), value: m.name }))],
    [materialsData],
  );
  const colours = useMemo(
    () => [
      { label: "All", value: "all" },
      ...Array.from(new Set(products.flatMap((p) => p.colors.map((c) => c.trim())).filter(Boolean)))
        .sort()
        .map((v) => ({ label: v, value: v })),
    ],
    [products],
  );

  const minPrice = useMemo(() => {
    if (!products.length) return 0;
    return Math.floor(Math.min(...products.map((p) => p.price)) / 100_000) * 100_000;
  }, [products]);
  const maxPrice = useMemo(() => {
    if (!products.length) return 1_200_000;
    return Math.ceil(Math.max(...products.map((p) => p.price)) / 100_000) * 100_000;
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (frame !== "all" && p.category !== frame) return false;
        if (material !== "all" && p.material !== material) return false;
        if (colour !== "all" && !p.colors.some((c) => c.toLowerCase() === colour.toLowerCase())) return false;
        if (p.price > priceMax) return false;
        return true;
      }),
    [frame, material, colour, priceMax, products],
  );

  const activeFilterCount =
    [frame, material, colour].filter((v) => v !== "all").length +
    (priceMax < maxPrice ? 1 : 0);

  const resetFilters = () => {
    setFrame("all");
    setMaterial("all");
    setColour("all");
    setPriceMax(maxPrice);
  };

  /* ── Filter sidebar content (shared between desktop + mobile) ──── */
  const filterPanel = (
    <div className="space-y-8 lg:space-y-10">
      {/* Frame type */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest">Frame Type</p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[10px] uppercase tracking-widest text-brand-black/45 transition-colors hover:text-brand-black lg:hidden"
          >
            Reset
          </button>
        </div>
        <ul className="space-y-1">
          {frameTypes.map((t) => (
            <li key={t.value}>
              <button
                type="button"
                onClick={() => setFrame(t.value)}
                className={cn(
                  "group flex min-h-10 w-full items-center gap-2 text-left text-sm transition-colors",
                  frame === t.value ? "text-brand-black" : "text-brand-black/50 hover:text-brand-black",
                )}
              >
                {/* Active indicator line */}
                <span
                  className={cn(
                    "h-px flex-shrink-0 transition-all duration-300",
                    frame === t.value ? "w-4 bg-brand-gold" : "w-0 bg-brand-gold group-hover:w-2",
                  )}
                />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Material */}
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-widest">Material</p>
        <ul className="space-y-1">
          {materials.map((m) => (
            <li key={m.value}>
              <button
                type="button"
                onClick={() => setMaterial(m.value)}
                className={cn(
                  "group flex min-h-10 w-full items-center gap-2 text-left text-sm transition-colors",
                  material === m.value ? "text-brand-black" : "text-brand-black/50 hover:text-brand-black",
                )}
              >
                <span
                  className={cn(
                    "h-px flex-shrink-0 transition-all duration-300",
                    material === m.value ? "w-4 bg-brand-gold" : "w-0 bg-brand-gold group-hover:w-2",
                  )}
                />
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Colour swatches */}
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-widest">Colour</p>
        <div className="flex flex-wrap gap-2.5">
          {colours.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-label={s.label}
              title={s.label}
              onClick={() => setColour(s.value)}
              className={cn(
                "h-7 w-7 rounded-full transition-all duration-200",
                s.value === "all"
                  ? "border border-brand-border bg-transparent text-[8px] font-medium text-brand-black/60"
                  : colourClass(s.label),
                colour === s.value
                  ? "scale-110 ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-cream"
                  : "hover:scale-105",
              )}
            >
              {s.value === "all" ? "ALL" : null}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest">Price</p>
          <p className="text-[10px] text-brand-black/50">
            up to {formatPrice(priceMax)}
          </p>
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice || 5_000_000}
          step={10_000}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-brand-gold"
        />
        <div className="mt-2 flex justify-between text-[10px] text-brand-black/40">
          <span>{formatPrice(minPrice)}</span>
          <span>{formatPrice(maxPrice)}+</span>
        </div>
      </div>

      {/* Desktop reset */}
      {activeFilterCount > 0 && (
        <motion.button
          type="button"
          onClick={resetFilters}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden text-xs uppercase tracking-widest text-brand-black/45 transition-colors hover:text-brand-black lg:block"
        >
          Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
        </motion.button>
      )}
    </div>
  );

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <PageTransition>
      {/* ── Shop hero strip ───────────────────────────────────────── */}
      <div className="border-b border-brand-border bg-brand-white pt-20">
        <div className="section-shell flex flex-col gap-1 py-8 sm:py-12">
          <motion.p
            className="text-[10px] uppercase tracking-widest text-brand-gold"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            The Collection
          </motion.p>
          <motion.h1
            className="font-serif text-2xl sm:text-3xl md:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            All Eyewear
          </motion.h1>
          <motion.p
            className="mt-1 max-w-md text-sm leading-relaxed text-brand-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Architectural frames built for the way you move through the world.
          </motion.p>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div className="section-shell overflow-x-hidden py-10 lg:py-14">

        {/* Mobile: filter trigger + count */}
        <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 border border-brand-border bg-brand-white px-4 text-xs uppercase tracking-widest transition-colors hover:border-brand-gold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            Refine
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center bg-brand-gold text-[9px] text-brand-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          <p className="text-xs text-brand-black/45">
            {loading ? (
              <span className="shimmer inline-block h-3 w-16 align-middle" />
            ) : (
              `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`
            )}
          </p>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row">
          {/* Desktop sidebar */}
          <aside className="hidden w-52 shrink-0 lg:block">{filterPanel}</aside>

          {/* Grid area */}
          <div className="min-w-0 flex-1">
            {/* Count + active chips */}
            <div className="mb-8 hidden items-center justify-between gap-4 lg:flex">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {frame !== "all" && (
                    <ActiveChip key="frame" label={fmtLabel(frame)} onRemove={() => setFrame("all")} />
                  )}
                  {material !== "all" && (
                    <ActiveChip key="mat" label={fmtLabel(material)} onRemove={() => setMaterial("all")} />
                  )}
                  {colour !== "all" && (
                    <ActiveChip key="col" label={colour} onRemove={() => setColour("all")} />
                  )}
                  {priceMax < maxPrice && (
                    <ActiveChip key="price" label={`up to ₦${(priceMax / 1000).toFixed(0)}k`} onRemove={() => setPriceMax(maxPrice)} />
                  )}
                </AnimatePresence>
              </div>
              <p className="shrink-0 text-xs text-brand-black/45">
                {loading ? (
                  <span className="shimmer inline-block h-3 w-16 align-middle" />
                ) : (
                  `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                )}
              </p>
            </div>

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} i={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-brand-border bg-brand-white px-8 py-16 text-center"
              >
                <p className="font-serif text-2xl text-brand-black/70">No results</p>
                <p className="mt-3 text-sm text-brand-black/45">
                  Adjust your filters to explore the full collection.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 text-xs uppercase tracking-widest text-brand-gold transition-opacity hover:opacity-70"
                >
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              <LayoutGroup>
                <motion.div
                  ref={gridRef}
                  layout
                  className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((product, i) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }}
                      >
                        <ProductCard product={product} index={i} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-50 bg-brand-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-sm flex-col bg-brand-cream shadow-[-24px_0_48px_rgba(0,0,0,0.18)] lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-black/50">
                    Refine
                  </p>
                  <p className="mt-0.5 font-serif text-xl">Filters</p>
                </div>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center border border-brand-border bg-brand-white transition-colors hover:border-brand-gold"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">{filterPanel}</div>
              <div className="border-t border-brand-border bg-brand-white px-6 py-4">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex min-h-11 w-full items-center justify-center bg-brand-black text-xs uppercase tracking-widest text-brand-white transition-colors hover:bg-brand-black/80"
                >
                  View {filtered.length} {filtered.length === 1 ? "Item" : "Items"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

/* ─── Active filter chip ─────────────────────────────────────────────── */
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onRemove}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18 }}
      className="inline-flex items-center gap-1.5 border border-brand-border bg-brand-white px-3 py-1.5 text-[10px] uppercase tracking-widest text-brand-black transition-colors hover:border-brand-gold"
    >
      {label}
      <X className="h-2.5 w-2.5" strokeWidth={2} />
    </motion.button>
  );
}
