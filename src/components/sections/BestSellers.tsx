"use client";

import { ProductCard } from "@/components/shop/ProductCard";
import { SCROLL_REVEAL } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export function BestSellers({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-space bg-brand-cream">
      <div className="section-shell">
        <div className="mb-10 flex items-center justify-between">
          <motion.h2 {...SCROLL_REVEAL} className="font-serif text-3xl">
            {title}
          </motion.h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="border border-brand-border p-2 hover:border-brand-gold"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="border border-brand-border p-2 hover:border-brand-gold"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[280px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
