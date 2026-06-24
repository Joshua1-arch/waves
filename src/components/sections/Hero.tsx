"use client";

import { Button } from "@/components/ui/Button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const container = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const item = {
  initial: { opacity: 0, y: 28 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax: image moves up slightly as user scrolls down
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  // Fade out the text as user scrolls
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Parallax + Ken-Burns background */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imageY }}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      >
        <Image
          src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80"
          alt="Clean studio shades photo"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      {/* Gradient overlay — richer than a flat dim */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/50 via-brand-black/30 to-brand-black/60" />

      {/* Animated content */}
      <motion.div
        className="relative z-10 mx-auto max-w-3xl px-6 text-center text-brand-white"
        variants={container}
        initial="initial"
        animate="animate"
        style={{ opacity: textOpacity }}
      >
        {/* Eyebrow — with a slow shimmer underline */}
        <motion.p
          variants={item}
          className="mb-6 inline-flex items-center gap-3 text-[10px] uppercase tracking-widest text-brand-white/75"
        >
          <span className="h-px w-8 bg-brand-gold" />
          {eyebrow}
          <span className="h-px w-8 bg-brand-gold" />
        </motion.p>

        <motion.h1
          variants={item}
          className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {headline}
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-brand-white/80"
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

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-brand-white/50"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
}
