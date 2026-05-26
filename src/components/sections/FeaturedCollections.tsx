"use client";

import { SCROLL_REVEAL } from "@/lib/constants";
import { collections } from "@/lib/products";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function FeaturedCollections() {
  return (
    <section className="section-space bg-brand-cream">
      <div className="section-shell">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">
              Curated Series
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">
              Featured Collections
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest hover:text-brand-gold"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {collections.map((collection, i) => (
            <motion.div key={collection.name} {...SCROLL_REVEAL}>
              <Link href={collection.href} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={`${collection.name} collection — Wave & Co.`}
                    fill
                    className="object-cover transition-transform duration-400 group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-brand-white">
                    <h3 className="font-serif text-xl">{collection.name}</h3>
                    <p className="mt-2 text-xs text-brand-white/80">
                      {collection.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
