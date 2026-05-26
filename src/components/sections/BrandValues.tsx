"use client";

import { SCROLL_REVEAL } from "@/lib/constants";
import { motion } from "framer-motion";
import { Award, Crown, Hammer } from "lucide-react";
import Image from "next/image";

const values = [
  {
    icon: Hammer,
    title: "Craftsmanship",
    text: "Traditional Japanese techniques meet contemporary architectural design in every hinge and temple.",
  },
  {
    icon: Award,
    title: "Quality",
    text: "Aerospace-grade titanium and bio-acetate selected for structural integrity and lasting clarity.",
  },
  {
    icon: Crown,
    title: "Legacy",
    text: "Modern heirlooms designed to be passed down — frames that outlast trends and seasons.",
  },
];

export function BrandValues() {
  return (
    <section className="section-space bg-brand-white">
      <div className="section-shell">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            className="relative aspect-[4/5] overflow-hidden"
            {...SCROLL_REVEAL}
          >
            <Image
              src="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80"
              alt="Clean studio eyewear photo"
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </motion.div>

          <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-1">
            {values.map((value) => (
              <motion.div key={value.title} {...SCROLL_REVEAL}>
                <value.icon
                  className="mb-4 h-5 w-5 text-brand-gold"
                  strokeWidth={1.5}
                />
                <h3 className="font-serif text-xl">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-black/70">
                  {value.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
