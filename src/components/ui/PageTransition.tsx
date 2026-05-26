"use client";

import { PAGE_TRANSITION } from "@/lib/constants";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={PAGE_TRANSITION.initial}
      animate={PAGE_TRANSITION.animate}
      transition={PAGE_TRANSITION.transition}
    >
      {children}
    </motion.div>
  );
}
