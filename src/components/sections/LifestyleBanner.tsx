"use client";

import { SCROLL_REVEAL } from "@/lib/constants";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface LifestyleBannerProps {
  eyebrow?: string;
  headline: string;
  body: string;
}

export function LifestyleBanner({
  eyebrow = "Eye Set on Vision",
  headline,
  body,
}: LifestyleBannerProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} className="relative h-[70vh] overflow-hidden">
      <motion.div className="absolute inset-0 scale-110" style={{ y }}>
        <Image
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80"
          alt="Clean eyewear photo in studio lighting"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-brand-black/45" />
      <motion.div
        className="relative z-10 flex h-full items-center"
        {...SCROLL_REVEAL}
      >
        <div className="section-shell max-w-xl text-brand-white">
          <p className="text-[10px] uppercase tracking-widest text-brand-gold">
            {eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-3xl italic sm:text-4xl md:text-5xl">
            {headline}
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-brand-white/80">
            {body}
          </p>
          <Link
            href="/about"
            className="mt-8 inline-block border-b border-brand-white pb-1 text-xs uppercase tracking-widest hover:text-brand-gold"
          >
            Explore the Brand
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
