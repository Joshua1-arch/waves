"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SCROLL_REVEAL } from "@/lib/constants";
import { motion } from "framer-motion";

export function Newsletter() {
  return (
    <section className="section-space bg-brand-cream">
      <motion.div className="section-shell max-w-2xl text-center" {...SCROLL_REVEAL}>
        <h2 className="font-serif text-3xl">Join the Circle</h2>
        <p className="mt-4 text-xs uppercase tracking-widest text-brand-black/60">
          Receive exclusive access to new releases and curated content
        </p>
        <form
          className="mt-8 flex flex-col gap-4 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            type="email"
            placeholder="Your email address"
            className="flex-1"
            aria-label="Email address"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      </motion.div>
    </section>
  );
}
