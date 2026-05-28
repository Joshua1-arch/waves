"use client";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AdminProductListItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  description: string;
  category: string;
  material: string;
  colors: string[];
  sizes: string[];
  images: string[];
  stock: number;
  featured?: boolean;
  collection?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const result = (await response.json()) as {
          data?: {
            products?: AdminProductListItem[];
          };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to fetch products.");
        }

        if (!cancelled) {
          setProducts(Array.isArray(result.data?.products) ? result.data.products : []);
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          toast.error(error instanceof Error ? error.message : "Unable to fetch products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(product: AdminProductListItem) {
    setDeletingId(product.id);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const result = (await response.json()) as {
        data?: {
          message?: string;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete product.");
      }

      setProducts((current) => current.filter((entry) => entry.id !== product.id));
      setSelectedProduct(null);
      toast.success(result.data?.message ?? "Product deleted successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="mt-1 text-sm text-brand-black/50">
            Manage catalogue, stock, and publishing status
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="mt-8 border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-brand-black/50" colSpan={6}>
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-brand-black/50" colSpan={6}>
                  No products found in MongoDB.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isDeleting = deletingId === product.id;

                return (
                  <tr key={product.id} className="border-b border-brand-border">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden bg-brand-cream">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="h-full w-full bg-brand-white" />
                          )}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{product.category}</td>
                    <td className="px-6 py-4 text-brand-gold">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className="bg-brand-gold/20 px-2 py-1 text-[10px] uppercase tracking-widest">
                        {(product.featured ?? false) ? "Featured" : "Published"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button type="button" variant="outline" className="gap-2 px-4 py-2">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 border-red-200 text-red-700 hover:bg-red-700 hover:text-white"
                          onClick={() => setSelectedProduct(product)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedProduct ? (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-brand-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => (deletingId ? null : setSelectedProduct(null))}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 z-[60] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border border-brand-border bg-brand-white p-8 shadow-card"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-brand-gold">
                Confirm deletion
              </p>
              <h2 className="mt-3 font-serif text-2xl">Delete product</h2>
              <p className="mt-4 text-sm leading-6 text-brand-black/60">
                Are you sure you want to delete {selectedProduct.name}? This cannot be undone.
              </p>

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                  disabled={Boolean(deletingId)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="gap-2 bg-red-700 text-white hover:bg-red-800"
                  onClick={() => void handleDelete(selectedProduct)}
                  disabled={Boolean(deletingId)}
                >
                  {deletingId === selectedProduct.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
