"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PageTransition } from "@/components/ui/PageTransition";
import { SCROLL_REVEAL } from "@/lib/constants";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Image from "next/image";

export default function ContactPage() {
  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <div className="grid gap-16 lg:grid-cols-2">
          <motion.div {...SCROLL_REVEAL}>
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">
              Inquiries
            </p>
            <h1 className="mt-4 font-serif text-4xl md:text-5xl">
              Let&apos;s craft your vision.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-brand-black/70">
              Whether you seek a private fitting or architectural consultation,
              our team provides an expert, unhurried experience tailored to your
              needs.
            </p>
            <dl className="mt-10 space-y-6">
              <div>
                <dt className="text-[10px] uppercase tracking-widest">Email</dt>
                <dd className="mt-1 text-sm">concierge@waveandco.arch</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest">
                  Flagship Studio
                </dt>
                <dd className="mt-1 text-sm">
                  742 Avenue of Architecture
                  <br />
                  Antwerp, Belgium 2000
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest">Phone</dt>
                <dd className="mt-1 text-sm">+32 (0) 3 241 89 00</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            className="border border-brand-border bg-brand-white/60 p-8"
            {...SCROLL_REVEAL}
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <Input label="Name" name="name" placeholder="Elias Thorne" />
              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="elias@example.com"
              />
              <Input label="Interest" name="interest" placeholder="Private fitting" />
              <Textarea label="Message" name="message" placeholder="Your message..." />
              <Button type="submit" fullWidth>
                Send Inquiry
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      <section className="relative h-[50vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80"
          alt="Clean premium eyewear campaign photo"
          fill
          className="object-cover grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-black/30">
          <div className="mb-4 flex h-12 w-12 items-center justify-center bg-brand-black">
            <MapPin className="h-5 w-5 text-brand-white" strokeWidth={1.5} />
          </div>
          <div className="bg-brand-white px-8 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-widest">
              Visit Our Atelier
            </p>
            <p className="mt-1 text-xs text-brand-black/60">
              Available by private appointment only.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell py-20 text-center">
        <blockquote className="mx-auto max-w-2xl font-serif text-2xl italic leading-relaxed md:text-3xl">
          &ldquo;Architecture is the learned game, correct and magnificent, of
          forms assembled in the light.&rdquo;
        </blockquote>
        <div className="mx-auto mt-6 h-px w-12 bg-brand-gold" />
      </section>
    </PageTransition>
  );
}
