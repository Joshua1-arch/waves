import type { ProductCategory, ProductMaterial } from "@/lib/types";

function normalizeProductOption(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface CollectionLike {
  _id?: unknown;
  name?: unknown;
  slug?: unknown;
}

interface ProductLike {
  _id?: unknown;
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  salePrice?: unknown;
  stock?: unknown;
  inStock?: unknown;
  category?: unknown;
  material?: unknown;
  colours?: unknown;
  images?: unknown;
  collection?: unknown;
  featured?: unknown;
}

export interface ProductViewModel {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  inStock: boolean;
  category: ProductCategory;
  material: ProductMaterial;
  colors: string[];
  sizes: string[];
  images: string[];
  featured: boolean;
  collection?: string;
}

function isCollectionLike(value: unknown): value is CollectionLike {
  return !!value && typeof value === "object";
}

export function mapProductDocumentToViewModel(product: ProductLike): ProductViewModel | null {
  if (
    !product ||
    typeof product !== "object" ||
    typeof product._id === "undefined" ||
    typeof product.slug !== "string" ||
    typeof product.name !== "string" ||
    typeof product.description !== "string" ||
    typeof product.price !== "number"
  ) {
    return null;
  }

  const category =
    typeof product.category === "string"
      ? (normalizeProductOption(product.category) as ProductCategory)
      : undefined;
  const material =
    typeof product.material === "string"
      ? (normalizeProductOption(product.material) as ProductMaterial)
      : undefined;

  if (!category || !material) {
    return null;
  }

  const colors = Array.isArray(product.colours)
    ? product.colours.filter((value): value is string => typeof value === "string")
    : [];

  const images = Array.isArray(product.images)
    ? product.images.filter((value): value is string => typeof value === "string")
    : [];

  const collection = isCollectionLike(product.collection)
    ? typeof product.collection.name === "string"
      ? product.collection.name
      : undefined
    : undefined;

  return {
    id: String(product._id),
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: typeof product.salePrice === "number" ? product.salePrice : undefined,
    stock: typeof product.stock === "number" ? product.stock : 0,
    inStock: typeof product.inStock === "boolean" ? product.inStock : true,
    category,
    material,
    colors,
    sizes: ["One Size"],
    images,
    featured: Boolean(product.featured),
    collection,
  };
}

export interface CollectionViewModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
}

export function mapCollectionDocumentToViewModel(collection: CollectionLike & {
  coverImage?: unknown;
  description?: unknown;
}): CollectionViewModel | null {
  if (
    !collection ||
    typeof collection !== "object" ||
    typeof collection._id === "undefined" ||
    typeof collection.name !== "string" ||
    typeof collection.slug !== "string"
  ) {
    return null;
  }

  return {
    id: String(collection._id),
    name: collection.name,
    slug: collection.slug,
    description:
      typeof collection.description === "string" ? collection.description : "",
    coverImage:
      typeof collection.coverImage === "string" ? collection.coverImage : "",
  };
}
