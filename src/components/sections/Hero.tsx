"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const container = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const item = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

interface HeroProps {
  eyebrow?: string;
  headline: string;
  subheadline: string;
  ctaText: string;
}

export function Hero({
  eyebrow = "Architectural Eyewear",
  headline,
  subheadline,
  ctaText,
}: HeroProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80"
        alt="Clean studio shades photo"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-brand-black/35" />

      <motion.div
        className="relative z-10 mx-auto max-w-3xl px-6 text-center text-brand-white"
        variants={container}
        initial="initial"
        animate="animate"
      >
        <motion.p
          variants={item}
          className="mb-4 text-[10px] uppercase tracking-widest"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          variants={item}
          className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl"
        >
          {headline}
        </motion.h1>
        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-brand-white/85"
        >
          {subheadline}
        </motion.p>
        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/shop">
            <Button>{ctaText}</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost">Our Story</Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
