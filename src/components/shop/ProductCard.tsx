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
  const isOutOfStock = product.inStock === false;

  return (
    <motion.article className="group relative min-w-0">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-brand-white">
          <Image
            src={product.images[0]}
            alt={`${product.name} — Wave & Co. architectural eyewear`}
            fill
            className="object-cover transition-transform duration-400 group-hover:scale-105"
            sizes="(max-width:640px) 50vw, (max-width:1280px) 33vw, 25vw"
          />
          {isOutOfStock ? (
            <div className="absolute left-3 top-3 z-10 border border-red-200 bg-red-600 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              Out of Stock
            </div>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 translate-y-0 bg-brand-black/80 p-3 transition-transform duration-300 sm:translate-y-full sm:group-hover:translate-y-0">
            <Button
              variant="gold"
              fullWidth
              disabled={isOutOfStock}
              onClick={(e) => {
                e.preventDefault();

                if (isOutOfStock) {
                  return;
                }

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
              {isOutOfStock ? "Out of Stock" : "Quick Add"}
            </Button>
          </div>
        </div>
        <div className="mt-4 px-1 text-center">
          <h3 className="break-words text-xs uppercase tracking-widest">{product.name}</h3>
          <p className="mt-1 text-sm text-brand-gold">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
