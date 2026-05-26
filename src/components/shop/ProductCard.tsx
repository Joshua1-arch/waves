"use client";

import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <motion.article className="group relative">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-brand-white">
          <Image
            src={product.images[0]}
            alt={`${product.name} — Wave & Co. architectural eyewear`}
            fill
            className="object-cover transition-transform duration-400 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 25vw"
          />
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-brand-black/80 p-3 transition-transform duration-300 group-hover:translate-y-0">
            <Button
              variant="gold"
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                addItem({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.images[0],
                  color: product.colors[0],
                  size: product.sizes[0],
                });
              }}
            >
              Quick Add
            </Button>
          </div>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-xs uppercase tracking-widest">{product.name}</h3>
          <p className="mt-1 text-sm text-brand-gold">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
