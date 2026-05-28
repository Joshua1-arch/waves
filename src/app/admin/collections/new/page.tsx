"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    };

    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminCollectionFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get("id");
  const isEditing = Boolean(collectionId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!collectionId) {
      return;
    }

    let active = true;

    async function loadCollection() {
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

        const collections = Array.isArray(payload.data?.collections)
          ? payload.data.collections
          : [];
        const collection = collections.find((entry) => entry.id === collectionId);

        if (!collection) {
          throw new Error("Collection not found.");
        }

        if (!active) {
          return;
        }

        setName(collection.name);
        setDescription(collection.description);
        setCoverImage(collection.coverImage);
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Unable to load collection.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCollection();

    return () => {
      active = false;
    };
  }, [collectionId]);

  const previewImage = useMemo(() => coverImage, [coverImage]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCoverImage(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read image.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        isEditing && collectionId
          ? `/api/admin/collections/${collectionId}`
          : "/api/admin/collections",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            coverImage,
          }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save collection.");
      }

      toast.success(
        payload.data?.message ??
          (isEditing ? "Collection updated successfully." : "Collection created successfully."),
      );
      router.push("/admin/collections");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save collection.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 border border-brand-border bg-brand-white p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/collections"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-brand-gold">
            Collections
          </p>
          <h1 className="mt-3 font-serif text-3xl">
            {isEditing ? "Edit Collection" : "New Collection"}
          </h1>
          <p className="mt-2 text-sm text-brand-black/50">
            Create and manage collection presentation for your storefront.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 border border-brand-border bg-brand-white p-6"
      >
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 animate-pulse bg-brand-cream" />
            <div className="h-32 animate-pulse bg-brand-cream" />
            <div className="h-10 animate-pulse bg-brand-cream" />
          </div>
        ) : (
          <div className="space-y-6">
            <Input
              label="Collection Name"
              value={name}
              underline={false}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="space-y-3">
              <label className="text-[10px] font-medium uppercase tracking-widest text-brand-black/70">
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm"
                onChange={handleFileChange}
              />
              {previewImage ? (
                <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden border border-brand-border bg-brand-cream">
                  <Image
                    src={previewImage}
                    alt="Collection preview"
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 24rem"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center border border-dashed border-brand-border bg-brand-cream text-xs uppercase tracking-widest text-brand-black/40">
                  No image selected
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Link href="/admin/collections">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
