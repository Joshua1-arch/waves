"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bold,
  ImagePlus,
  Italic,
  LoaderCircle,
  Package,
  Plus,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface AdminCollection {
  id: string;
  name: string;
  slug: string;
}

interface TaxonomyOption {
  id: string;
  type: "category" | "material";
  name: string;
  slug: string;
  createdAt: string;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  category: string;
  material: string;
  colours: string[];
  images: string[];
  collection: string | null;
  featured: boolean;
}

type ProductTab = "general" | "inventory" | "shipping";
type ProductStatus = "published" | "draft";
type ProductVisibility = "online" | "hidden";

const productTabs: { id: ProductTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "inventory", label: "Inventory" },
  { id: "shipping", label: "Shipping" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function RichTextToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center border-r border-brand-border text-brand-black/70 transition-colors hover:bg-brand-cream hover:text-brand-black last:border-r-0"
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-brand-border bg-brand-white">
      <div className="border-b border-brand-border px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-gold">{title}</p>
        {description ? (
          <p className="mt-2 text-xs leading-5 text-brand-black/55">{description}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

async function fetchTaxonomies(type: "category" | "material") {
  const response = await fetch(`/api/admin/taxonomies?type=${type}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  const payload = (await response.json()) as {
    data?: {
      taxonomies?: TaxonomyOption[];
    };
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Unable to load ${type} options.`);
  }

  return Array.isArray(payload.data?.taxonomies) ? payload.data.taxonomies : [];
}

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = typeof params?.id === "string" ? params.id : "";

  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [categories, setCategories] = useState<TaxonomyOption[]>([]);
  const [materials, setMaterials] = useState<TaxonomyOption[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingCollection, setAddingCollection] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductTab>("general");

  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<ProductStatus>("published");
  const [visibility, setVisibility] = useState<ProductVisibility>("online");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [colours, setColours] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newMaterialName, setNewMaterialName] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCollections() {
      try {
        const response = await fetch("/api/admin/collections", {
          cache: "no-store",
          credentials: "same-origin",
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

        const nextCollections = Array.isArray(payload.data?.collections) ? payload.data.collections : [];

        if (!active) {
          return;
        }

        setCollections(nextCollections);
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Unable to load collections.",
        );
        setCollections([]);
      } finally {
        if (active) {
          setCollectionsLoading(false);
        }
      }
    }

    async function loadTaxonomies() {
      try {
        const [categoryOptions, materialOptions] = await Promise.all([
          fetchTaxonomies("category"),
          fetchTaxonomies("material"),
        ]);

        if (!active) {
          return;
        }

        setCategories(categoryOptions);
        setMaterials(materialOptions);
        setCategory((current) => current || categoryOptions[0]?.name || "");
        setMaterial((current) => current || materialOptions[0]?.name || "");
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Unable to load taxonomy options.",
        );
        setCategories([]);
        setMaterials([]);
      } finally {
        if (active) {
          setTaxonomiesLoading(false);
        }
      }
    }

    void loadCollections();
    void loadTaxonomies();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      if (!productId) {
        toast.error("Product not found.");
        router.push("/admin/products");
        return;
      }

      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          cache: "no-store",
          credentials: "same-origin",
        });

        const payload = (await response.json()) as {
          data?: {
            product?: AdminProduct;
          };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load product.");
        }

        const product = payload.data?.product;

        if (!active || !product) {
          return;
        }

        setName(product.name ?? "");
        setCustomSlug(product.slug ?? "");
        setSlugTouched(false);
        setDescription(product.description ?? "");
        setPrice(String(product.price ?? ""));
        setSalePrice(
          typeof product.salePrice === "number" ? String(product.salePrice) : "",
        );
        setStock(String(product.stock ?? 0));
        setCategory(product.category ?? "");
        setMaterial(product.material ?? "");
        setCollectionId(product.collection ?? "");
        setFeaturedImage(product.images?.[0] ?? "");
        setGalleryImages(product.images?.slice(1) ?? []);
        setFeatured(Boolean(product.featured));
        setColours(Array.isArray(product.colours) ? product.colours.join(", ") : "");
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(error instanceof Error ? error.message : "Unable to load product.");
        router.push("/admin/products");
      } finally {
        if (active) {
          setProductLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, [productId, router]);

  const slug = useMemo(
    () => (slugTouched ? slugify(customSlug) : slugify(name)),
    [customSlug, name, slugTouched],
  );

  const permalink = useMemo(() => `/shop/${slug || "updated-product"}`, [slug]);
  const allImages = useMemo(
    () => [featuredImage, ...galleryImages].filter(Boolean),
    [featuredImage, galleryImages],
  );

  const parsedTags = useMemo(
    () => tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tags],
  );

  const parsedColours = useMemo(
    () => colours.split(",").map((colour) => colour.trim()).filter(Boolean),
    [colours],
  );

  function wrapSelection(before: string, after = before) {
    setDescription((current) => `${current}${before}${after}`);
  }

  async function handleFeaturedImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await fileToDataUrl(file);
      setFeaturedImage(image);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read image.");
    }
  }

  async function handleGalleryImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    try {
      const images = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setGalleryImages((current) => [...current, ...images]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read image.");
    }
  }

  function removeGalleryImage(index: number) {
    setGalleryImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
  }

  async function handleAddCollection() {
    const trimmedName = newCollectionName.trim();

    if (!trimmedName) {
      toast.error("Collection name is required.");
      return;
    }

    setAddingCollection(true);

    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: trimmedName,
          description: "",
          coverImage: "",
        }),
      });

      const payload = (await response.json()) as {
        data?: {
          collection?: AdminCollection;
          message?: string;
        };
        error?: string;
      };

      const collection = payload.data?.collection;

      if (!response.ok || !collection) {
        throw new Error(payload.error ?? "Unable to create collection.");
      }

      setCollections((current) => [...current, collection]);
      setCollectionId(collection.id);
      setNewCollectionName("");
      toast.success(payload.data?.message ?? "Collection created successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create collection.");
    } finally {
      setAddingCollection(false);
    }
  }

  async function handleAddTaxonomy(type: "category" | "material") {
    const isCategory = type === "category";
    const nameValue = isCategory ? newCategoryName : newMaterialName;
    const trimmedName = nameValue.trim();

    if (!trimmedName) {
      toast.error(`${isCategory ? "Category" : "Material"} name is required.`);
      return;
    }

    if (isCategory) {
      setAddingCategory(true);
    } else {
      setAddingMaterial(true);
    }

    try {
      const response = await fetch("/api/admin/taxonomies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          type,
          name: trimmedName,
        }),
      });

      const payload = (await response.json()) as {
        data?: {
          taxonomy?: TaxonomyOption;
          message?: string;
        };
        error?: string;
      };

      const taxonomy = payload.data?.taxonomy;

      if (!response.ok || !taxonomy) {
        throw new Error(payload.error ?? `Unable to create ${type}.`);
      }

      if (isCategory) {
        setCategories((current) => [...current, taxonomy]);
        setCategory(taxonomy.name);
        setNewCategoryName("");
      } else {
        setMaterials((current) => [...current, taxonomy]);
        setMaterial(taxonomy.name);
        setNewMaterialName("");
      }

      toast.success(payload.data?.message ?? `${isCategory ? "Category" : "Material"} created successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to create ${type}.`);
    } finally {
      if (isCategory) {
        setAddingCategory(false);
      } else {
        setAddingMaterial(false);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!featuredImage) {
      toast.error("A featured image is required.");
      return;
    }

    if (!slug.trim()) {
      toast.error("A permalink is required.");
      return;
    }

    if (!category) {
      toast.error("A category is required.");
      return;
    }

    if (!material) {
      toast.error("A material is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          slug,
          description,
          price,
          salePrice: salePrice.trim() ? salePrice : null,
          stock,
          category,
          material,
          colours: parsedColours,
          images: [featuredImage, ...galleryImages],
          collection: collectionId || null,
          featured,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update product.");
      }

      toast.success(payload.data?.message ?? "Product updated successfully.");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update product.");
    } finally {
      setSaving(false);
    }
  }

  if (productLoading) {
    return (
      <div className="border border-brand-border bg-brand-white px-6 py-16 text-center text-sm text-brand-black/55">
        Loading product editor...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-6 border border-brand-border bg-brand-white p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-brand-gold">
            Catalogue
          </p>
          <h1 className="mt-3 font-serif text-3xl">Edit Product</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-black/50">
            Update editorial content, pricing, media, and storefront settings for this product.
          </p>
        </div>
        <div className="border border-brand-border bg-brand-cream px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-black/50">
            Publish State
          </p>
          <p className="mt-2 text-sm text-brand-black">
            {status === "published" ? "Ready to update" : "Saved as draft in the editor"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.9fr)_360px]">
        <div className="space-y-8">
          <section className="border border-brand-border bg-brand-white p-6">
            <Input
              label="Product Name"
              value={name}
              underline={false}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Monolith Slim"
              required
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
              <p className="text-[10px] font-medium uppercase tracking-widest text-brand-black/70">
                Permalink
              </p>
              <div className="border border-brand-border bg-brand-cream/70 px-4 py-3 text-sm text-brand-black/75">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <span className="shrink-0 text-brand-black/45">waveandco.com</span>
                  <input
                    value={slugTouched ? customSlug : slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setCustomSlug(event.target.value);
                    }}
                    className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                    aria-label="Permalink"
                    required
                  />
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-brand-black/40">
              Preview: {permalink}
            </p>
          </section>

          <section className="border border-brand-border bg-brand-white">
            <div className="border-b border-brand-border px-6 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-brand-gold">
                Description
              </p>
              <p className="mt-2 text-xs text-brand-black/55">
                Write editorial copy and use lightweight formatting for emphasis.
              </p>
            </div>
            <div className="border-b border-brand-border bg-brand-cream/50">
              <div className="flex items-center">
                <RichTextToolbarButton label="Bold" onClick={() => wrapSelection("**")}>
                  <Bold className="h-4 w-4" />
                </RichTextToolbarButton>
                <RichTextToolbarButton label="Italic" onClick={() => wrapSelection("*")}>
                  <Italic className="h-4 w-4" />
                </RichTextToolbarButton>
              </div>
            </div>
            <div className="p-6">
              <Textarea
                label="Product Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="gap-3"
                rows={10}
                placeholder="Describe the craftsmanship, silhouette, and finish."
              />
            </div>
          </section>

          <section className="border border-brand-border bg-brand-white">
            <div className="flex flex-wrap border-b border-brand-border">
              {productTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "border-r border-brand-border px-5 py-4 text-[10px] uppercase tracking-[0.24em] transition-colors last:border-r-0",
                    activeTab === tab.id
                      ? "bg-brand-black text-brand-white"
                      : "bg-brand-white text-brand-black/55 hover:bg-brand-cream",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "general" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Regular Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    underline={false}
                    onChange={(event) => setPrice(event.target.value)}
                    required
                  />
                  <Input
                    label="Sale Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    underline={false}
                    onChange={(event) => setSalePrice(event.target.value)}
                  />
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-brand-black/70">
                      Material
                    </label>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      {materials.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setMaterial(option.name)}
                          className={cn(
                            "border px-4 py-3 text-left text-sm transition-colors",
                            material === option.name
                              ? "border-brand-black bg-brand-black text-brand-white"
                              : "border-brand-border bg-brand-cream/40 text-brand-black hover:bg-brand-cream",
                          )}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <input
                        value={newMaterialName}
                        onChange={(event) => setNewMaterialName(event.target.value)}
                        placeholder="+ Add new material"
                        className="w-full border border-brand-border bg-brand-white px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => void handleAddTaxonomy("material")}
                        disabled={addingMaterial}
                      >
                        {addingMaterial ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                      </Button>
                    </div>
                    {taxonomiesLoading ? (
                      <p className="mt-3 text-xs text-brand-black/50">Loading materials...</p>
                    ) : null}
                  </div>
                  <Input
                    label="Colours"
                    value={colours}
                    underline={false}
                    onChange={(event) => setColours(event.target.value)}
                    placeholder="Black, Tortoise, Gold"
                    className="md:col-span-2"
                  />
                </div>
              ) : null}

              {activeTab === "inventory" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Stock Quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    underline={false}
                    onChange={(event) => setStock(event.target.value)}
                    required
                  />
                  <Input
                    label="SKU"
                    value={sku}
                    underline={false}
                    onChange={(event) => setSku(event.target.value)}
                    placeholder="UI only"
                  />
                  <div className="md:col-span-2 border border-dashed border-brand-border bg-brand-cream/40 px-4 py-4 text-xs leading-6 text-brand-black/55">
                    SKU and stock presentation match the CMS layout, but only stock is persisted in
                    the current product schema.
                  </div>
                </div>
              ) : null}

              {activeTab === "shipping" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Weight"
                    value={weight}
                    underline={false}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder="UI only"
                  />
                  <Input
                    label="Dimensions"
                    value={dimensions}
                    underline={false}
                    onChange={(event) => setDimensions(event.target.value)}
                    placeholder="UI only"
                  />
                  <div className="md:col-span-2 border border-dashed border-brand-border bg-brand-cream/40 px-4 py-4 text-xs leading-6 text-brand-black/55">
                    Shipping details are displayed for editorial parity with a full CMS and are not
                    currently persisted by the product schema.
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Panel
            title="Publish"
            description="Control publish intent and featured merchandising before saving."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between border border-brand-border bg-brand-cream/50 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-black/45">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-brand-black">
                    {status === "published" ? "Published" : "Draft"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={cn(
                      "border px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors",
                      status === "draft"
                        ? "border-brand-black bg-brand-black text-brand-white"
                        : "border-brand-border bg-brand-white text-brand-black/55 hover:bg-brand-cream",
                    )}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("published")}
                    className={cn(
                      "border px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors",
                      status === "published"
                        ? "border-brand-black bg-brand-black text-brand-white"
                        : "border-brand-border bg-brand-white text-brand-black/55 hover:bg-brand-cream",
                    )}
                  >
                    Live
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border border-brand-border bg-brand-cream/50 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-black/45">
                    Visibility
                  </p>
                  <p className="mt-2 text-sm text-brand-black">
                    {visibility === "online" ? "Visible on storefront" : "Hidden from storefront"}
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-brand-black/60">
                  <input
                    type="checkbox"
                    checked={visibility === "online"}
                    onChange={(event) =>
                      setVisibility(event.target.checked ? "online" : "hidden")
                    }
                  />
                  Online
                </label>
              </div>

              <label className="flex items-center justify-between border border-brand-border px-4 py-3 text-sm text-brand-black">
                <span className="inline-flex items-center gap-2">
                  <Package className="h-4 w-4 text-brand-gold" />
                  Feature on homepage
                </span>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                />
              </label>

              <Button type="submit" fullWidth disabled={saving} className="gap-2">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Panel>

          <Panel
            title="Featured Image"
            description="Select the primary image used in listings and product detail views."
          >
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-brand-border bg-brand-cream/40 px-4 py-4 text-xs uppercase tracking-[0.22em] text-brand-black/60 transition-colors hover:bg-brand-cream">
                <ImagePlus className="h-4 w-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFeaturedImageChange}
                />
              </label>

              {featuredImage ? (
                <div className="relative aspect-square overflow-hidden border border-brand-border bg-brand-cream">
                  <Image
                    src={featuredImage}
                    alt="Featured product preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 360px"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center border border-brand-border bg-brand-cream/60 text-xs uppercase tracking-[0.22em] text-brand-black/35">
                  No featured image selected
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Gallery"
            description="Add supporting imagery for thumbnails and product storytelling."
          >
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-brand-border bg-brand-cream/40 px-4 py-4 text-xs uppercase tracking-[0.22em] text-brand-black/60 transition-colors hover:bg-brand-cream">
                <ImagePlus className="h-4 w-4" />
                Add Gallery Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryImagesChange}
                />
              </label>

              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {galleryImages.map((image, index) => (
                    <div
                      key={`${image.slice(0, 24)}-${index}`}
                      className="border border-brand-border bg-brand-white"
                    >
                      <div className="relative aspect-square overflow-hidden bg-brand-cream">
                        <Image
                          src={image}
                          alt={`Gallery preview ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="w-full border-t border-brand-border px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-brand-black/60 transition-colors hover:bg-brand-cream"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-brand-border bg-brand-cream/60 px-4 py-5 text-center text-xs uppercase tracking-[0.22em] text-brand-black/35">
                  No gallery images added
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Collection"
            description="Assign this product to an existing storefront collection or create a new one."
          >
            <label className="text-[10px] font-medium uppercase tracking-widest text-brand-black/70">
              Select Collection
            </label>
            <select
              value={collectionId}
              onChange={(event) => setCollectionId(event.target.value)}
              className="mt-2 w-full border border-brand-border bg-brand-white px-4 py-3 text-sm text-brand-black outline-none transition-all duration-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
            >
              <option value="">
                {collectionsLoading ? "Loading collections..." : "No collection"}
              </option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-3">
              <input
                value={newCollectionName}
                onChange={(event) => setNewCollectionName(event.target.value)}
                placeholder="+ Add new collection"
                className="w-full border border-brand-border bg-brand-white px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleAddCollection()}
                disabled={addingCollection}
              >
                {addingCollection ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </Panel>

          <Panel
            title="Category"
            description="Choose the primary frame silhouette used in catalog filtering or create a new one."
          >
            <div className="space-y-3">
              {categories.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-center justify-between border px-4 py-3 text-sm transition-colors",
                    category === option.name
                      ? "border-brand-black bg-brand-black text-brand-white"
                      : "border-brand-border bg-brand-cream/40 text-brand-black hover:bg-brand-cream",
                  )}
                >
                  <span>{option.name}</span>
                  <input
                    type="radio"
                    name="category"
                    checked={category === option.name}
                    onChange={() => setCategory(option.name)}
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="+ Add new category"
                className="w-full border border-brand-border bg-brand-white px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleAddTaxonomy("category")}
                disabled={addingCategory}
              >
                {addingCategory ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
            {taxonomiesLoading ? (
              <p className="mt-3 text-xs text-brand-black/50">Loading categories...</p>
            ) : null}
          </Panel>

          <Panel
            title="Tags"
            description="Comma-separated editorial tags for merchandising notes in the UI."
          >
            <div className="space-y-4">
              <Input
                label="Tags"
                value={tags}
                underline={false}
                onChange={(event) => setTags(event.target.value)}
                placeholder="limited edition, acetate, hero"
              />

              {parsedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {parsedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 border border-brand-border bg-brand-cream px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-brand-black/70"
                    >
                      <Tag className="h-3.5 w-3.5 text-brand-gold" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-brand-border bg-brand-cream/40 px-4 py-4 text-xs leading-6 text-brand-black/55">
                  Tags are currently UI-only and are not saved by the current product API.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Preview Summary" description="Quick overview of the product media payload.">
            <div className="space-y-3 text-sm text-brand-black/60">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <span>Total images</span>
                <span className="font-medium text-brand-black">{allImages.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <span>Colours</span>
                <span className="font-medium text-brand-black">{parsedColours.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Collection</span>
                <span className="font-medium text-brand-black">
                  {collections.find((collection) => collection.id === collectionId)?.name ?? "None"}
                </span>
              </div>
            </div>
          </Panel>
        </aside>
      </form>
    </div>
  );
}
