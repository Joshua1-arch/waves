"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { SCROLL_REVEAL } from "@/lib/constants";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface AboutPageClientProps {
  content: {
    headline: string;
    subheadline: string;
    story: string;
    mission: string;
  };
}

const timeline = [
  {
    year: "2014",
    title: "The Inception",
    text: "Our first studio opened in Milan — a space dedicated to the marriage of optical science and architectural form.",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1400&q=80",
    imageLeft: false,
  },
  {
    year: "2018",
    title: "Structural Shift",
    text: "Innovation in frame mechanics led to our signature hinge — a pivot point engineered for decades of daily wear.",
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1400&q=80",
    imageLeft: true,
  },
  {
    year: "2024",
    title: "Global Presence",
    text: "Flagship galleries now span Antwerp, Tokyo, and New York — each a temple to quiet luxury and material clarity.",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1400&q=80",
    imageLeft: false,
  },
];

export function AboutPageClient({ content }: AboutPageClientProps) {
  return (
    <PageTransition>
      <section className="section-shell section-space pt-28 text-center">
        <p className="text-[10px] uppercase tracking-widest text-brand-gold">
          The Vision
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl font-serif text-3xl leading-snug md:text-5xl">
          {content.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-brand-black/70">
          {content.subheadline}
        </p>
      </section>

      <section className="section-shell pb-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div className="relative aspect-square overflow-hidden" {...SCROLL_REVEAL}>
            <Image
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"
              alt="Clean portrait wearing premium eyewear"
              fill
              className="object-cover grayscale"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </motion.div>
          <motion.div {...SCROLL_REVEAL}>
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">
              Founder&apos;s Note
            </p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Wells</h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-brand-black/70">
              <p>{content.story}</p>
              <p>{content.mission}</p>
              <p>
                Today, our ateliers in Milan and Antwerp continue this legacy,
                blending Japanese craftsmanship with European architectural
                sensibility.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-shell section-space border-t border-brand-border">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest">Our Journey</p>
          <h2 className="mt-4 font-serif text-3xl">A Legacy of Precision</h2>
        </div>
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-brand-border md:block" />
          {timeline.map((item) => (
            <motion.div
              key={item.year}
              className="mb-16 grid gap-8 md:mb-20 md:grid-cols-2 md:items-center"
              {...SCROLL_REVEAL}
            >
              {item.imageLeft ? (
                <>
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={`${item.title} — Wave & Co. history`}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="md:pl-12">
                    <p className="font-serif text-2xl text-brand-gold">
                      {item.year}
                    </p>
                    <h3 className="mt-2 font-serif text-xl">{item.title}</h3>
                    <p className="mt-4 text-sm text-brand-black/70">
                      {item.text}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="order-2 md:order-1 md:pr-12 md:text-right">
                    <p className="font-serif text-2xl text-brand-gold">
                      {item.year}
                    </p>
                    <h3 className="mt-2 font-serif text-xl">{item.title}</h3>
                    <p className="mt-4 text-sm text-brand-black/70">
                      {item.text}
                    </p>
                  </div>
                  <div className="relative order-1 aspect-[16/9] overflow-hidden md:order-2">
                    <Image
                      src={item.image}
                      alt={`${item.title} — Wave & Co. history`}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 50vw"
                    />
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-shell section-space">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest">Collections</p>
            <h2 className="mt-2 font-serif text-3xl">The WAVE Aesthetic</h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest hover:text-brand-gold"
          >
            View All
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              src: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80",
              alt: "Clean editorial eyewear portrait",
            },
            {
              src: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
              alt: "Clean tortoise eyewear studio photo",
            },
            {
              src: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
              alt: "Clean black eyewear studio photo",
            },
          ].map((img) => (
            <motion.div
              key={img.src}
              className="relative aspect-[3/4] overflow-hidden"
              {...SCROLL_REVEAL}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width:640px) 100vw, (max-width:768px) 50vw, 33vw"
              />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-shell pb-28">
        <div className="mx-auto max-w-lg border border-brand-border bg-brand-white p-8 text-center sm:p-10">
          <h2 className="font-serif text-2xl">Stay Informed</h2>
          <p className="mt-4 text-sm text-brand-black/60">
            Receive early access to seasonal collections and architectural
            insights from the studio.
          </p>
          <form
            className="mt-8 flex flex-col gap-4 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input placeholder="Your email" aria-label="Email" className="flex-1" />
            <Button type="submit" className="w-full sm:w-auto">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </PageTransition>
  );
}
