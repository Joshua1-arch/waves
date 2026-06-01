"use client";

import { Button } from "@/components/ui/Button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  productCount: number;
  createdAt: string;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCollections() {
      setLoading(true);

      try {
        const response = await fetch("/api/admin/collections", {
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          data?: {
            collections?: AdminCollection[];
          };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load collections.");
        }

        if (!active) {
          return;
        }

        setCollections(
          Array.isArray(payload.data?.collections) ? payload.data.collections : [],
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setCollections([]);
        toast.error(
          error instanceof Error ? error.message : "Unable to load collections.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCollections();

    return () => {
      active = false;
    };
  }, []);

  async function executeDelete(collection: AdminCollection) {
    setDeletingId(collection.id);

    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete collection.");
      }

      setCollections((current) =>
        current.filter((entry) => entry.id !== collection.id),
      );
      toast.success(payload.data?.message ?? "Collection deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete collection.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleDelete(collection: AdminCollection) {
    toast(`Delete collection "${collection.name}"?`, {
      description: "This can only be done when it has no products.",
      action: {
        label: "Delete",
        onClick: () => void executeDelete(collection),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
      duration: 10000,
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Collections</h1>
          <p className="mt-1 text-sm text-brand-black/50">
            Manage storefront collections and their presentation.
          </p>
        </div>
        <Link href="/admin/collections/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      <div className="mt-8 overflow-hidden border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-black/50">
              <th className="px-6 py-4">Cover Image</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">No. of Products</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-brand-black/50" colSpan={6}>
                  Loading collections...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-brand-black/50" colSpan={6}>
                  No collections found.
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="border-b border-brand-border last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="relative h-14 w-14 overflow-hidden bg-brand-cream">
                      {collection.coverImage ? (
                        <Image
                          src={collection.coverImage}
                          alt={collection.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="h-full w-full bg-brand-cream" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{collection.name}</td>
                  <td className="px-6 py-4 text-brand-black/60">{collection.slug}</td>
                  <td className="px-6 py-4">{collection.productCount}</td>
                  <td className="px-6 py-4">{formatDate(collection.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/collections/new?id=${collection.id}`}>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/70 hover:text-brand-gold"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(collection)}
                        disabled={deletingId === collection.id}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === collection.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
