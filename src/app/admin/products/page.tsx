"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { products } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function AdminProductsPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [published, setPublished] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="mt-1 text-sm text-brand-black/50">
            Manage catalogue, stock, and publishing status
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setPanelOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
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
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-brand-border">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden bg-brand-cream">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 capitalize">{p.category}</td>
                <td className="px-6 py-4 text-brand-gold">
                  {formatPrice(p.price)}
                </td>
                <td className="px-6 py-4">24</td>
                <td className="px-6 py-4">
                  <span className="bg-brand-gold/20 px-2 py-1 text-[10px] uppercase tracking-widest">
                    Published
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-brand-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-[60] h-full w-full max-w-lg overflow-y-auto bg-brand-white p-8"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <h2 className="font-serif text-2xl">Add Product</h2>
              <form
                className="mt-8 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPanelOpen(false);
                }}
              >
                <Input label="Name" name="name" required />
                <Input label="Price" name="price" type="number" required />
                <Input label="Stock" name="stock" type="number" required />
                <Input label="Category" name="category" required />
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-black/70">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="mt-2 w-full border border-brand-border p-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold/40"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-black/70">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 w-full text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPreview(URL.createObjectURL(file));
                    }}
                  />
                  {preview && (
                    <div className="relative mt-4 aspect-square w-32 overflow-hidden">
                      <Image
                        src={preview}
                        alt="Upload preview"
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-3 text-xs uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  Published
                </label>
                <div className="flex gap-3">
                  <Button type="submit" fullWidth>
                    Save Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPanelOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
