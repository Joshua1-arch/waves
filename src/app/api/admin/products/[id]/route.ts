import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { getProductModel } from "@/lib/models/Product";
import { getTaxonomyModel } from "@/lib/models/Taxonomy";
import { cookies } from "next/headers";
import { Types } from "mongoose";

interface ProductMutationBody {
  name?: unknown;
  slug?: unknown;
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

interface NormalizedProductPayload {
  name: string;
  slug: string;
  description: string;
  price: number | null;
  salePrice: number | null;
  stock: number | null;
  inStock?: boolean;
  category: string;
  material: string;
  colours: string[];
  images: string[];
  featured?: boolean;
  collection: string;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  return payload.role === "admin" ? payload : null;
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizePayload(body: ProductMutationBody): NormalizedProductPayload {
  const name = toOptionalTrimmedString(body.name);
  const slug = toOptionalTrimmedString(body.slug);
  const description = toOptionalTrimmedString(body.description);
  const price = typeof body.price === "undefined" ? null : toNumber(body.price);
  const salePrice =
    body.salePrice === null
      ? null
      : typeof body.salePrice === "undefined"
        ? null
        : toNumber(body.salePrice);
  const stock = typeof body.stock === "undefined" ? null : toNumber(body.stock);
  const inStock = typeof body.inStock === "boolean" ? body.inStock : undefined;
  const category = toOptionalTrimmedString(body.category);
  const material = toOptionalTrimmedString(body.material);
  const colours = Array.from(new Set(toStringArray(body.colours)));
  const images = Array.from(new Set(toStringArray(body.images)));
  const featured = typeof body.featured === "boolean" ? body.featured : undefined;
  const collection = toTrimmedString(body.collection);

  return {
    name: name ?? "",
    slug: slug ?? "",
    description: description ?? "",
    price,
    salePrice,
    stock,
    inStock,
    category: category ?? "",
    material: material ?? "",
    colours,
    images,
    featured,
    collection,
  };
}

async function validateFullPayload(payload: NormalizedProductPayload) {
  if (!payload.name) {
    return "Product name is required.";
  }

  if (payload.price === null || payload.price < 0) {
    return "Price must be a valid number greater than or equal to 0.";
  }

  if (payload.salePrice !== null && payload.salePrice < 0) {
    return "Sale price must be greater than or equal to 0.";
  }

  if (payload.salePrice !== null && payload.price !== null && payload.salePrice > payload.price) {
    return "Sale price cannot be greater than the regular price.";
  }

  if (payload.stock === null || payload.stock < 0 || !Number.isInteger(payload.stock)) {
    return "Stock must be a whole number greater than or equal to 0.";
  }

  if (!payload.category) {
    return "Please select a category.";
  }

  if (!payload.material) {
    return "Please select a material.";
  }

  if (payload.images.length === 0) {
    return "At least one product image is required.";
  }

  if (payload.collection && !Types.ObjectId.isValid(payload.collection)) {
    return "Please select a valid collection.";
  }

  const Taxonomy = getTaxonomyModel();
  const [categoryExists, materialExists] = await Promise.all([
    Taxonomy.findOne({ type: "category", name: payload.category }).lean(),
    Taxonomy.findOne({ type: "material", name: payload.material }).lean(),
  ]);

  if (!categoryExists) {
    return "Please select a valid category.";
  }

  if (!materialExists) {
    return "Please select a valid material.";
  }

  return null;
}

function serializeProduct(product: {
  _id: unknown;
  name?: string;
  slug?: string | null;
  description?: string;
  price?: number;
  salePrice?: number | null;
  stock?: number;
  inStock?: boolean;
  category?: string;
  material?: string;
  colours?: string[];
  images?: string[];
  collection?: unknown;
  featured?: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(product._id),
    name: product.name ?? "",
    slug: product.slug ?? "",
    description: product.description ?? "",
    price: product.price ?? 0,
    salePrice: product.salePrice ?? null,
    stock: product.stock ?? 0,
    inStock: typeof product.inStock === "boolean" ? product.inStock : true,
    category: product.category ?? "",
    material: product.material ?? "",
    colours: Array.isArray(product.colours) ? product.colours : [],
    images: Array.isArray(product.images) ? product.images : [],
    collection: product.collection ? String(product.collection) : null,
    featured: Boolean(product.featured),
    createdAt: product.createdAt ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return apiError("Product not found.", { status: 404 });
    }

    await connectToDatabase();

    const Product = getProductModel();
    const product = await Product.findById(id).lean();

    if (!product || typeof product !== "object" || !("_id" in product)) {
      return apiError("Product not found.", { status: 404 });
    }

    return apiSuccess({
      product: serializeProduct(product),
    });
  } catch {
    return apiError("Unable to fetch product.", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return apiError("Product not found.", { status: 404 });
    }

    const body = (await request.json()) as ProductMutationBody;
    const keys = Object.keys(body);

    if (keys.length === 0) {
      return apiError("No updates provided.", { status: 400 });
    }

    await connectToDatabase();

    const Product = getProductModel();

    if (keys.length === 1 && "inStock" in body && typeof body.inStock === "boolean") {
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: { inStock: body.inStock } },
        { new: true },
      ).lean();

      if (!updatedProduct || typeof updatedProduct !== "object" || !("_id" in updatedProduct)) {
        return apiError("Product not found.", { status: 404 });
      }

      return apiSuccess({
        product: serializeProduct(updatedProduct),
        message: "Stock status updated successfully.",
      });
    }

    const payload = normalizePayload(body);
    
    // Auto-generate slug from name if it is empty/omitted
    if (!payload.slug && payload.name) {
      payload.slug = payload.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const validationError = await validateFullPayload(payload);

    if (validationError) {
      return apiError(validationError, { status: 400 });
    }

    const duplicateQuery = payload.slug
      ? { slug: payload.slug, _id: { $ne: id } }
      : { name: payload.name, _id: { $ne: id } };

    const existingProduct = await Product.findOne(duplicateQuery).lean();

    if (existingProduct) {
      return apiError(
        payload.slug
          ? "A product with this permalink already exists."
          : "A product with this name already exists.",
        { status: 409 },
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: payload.name,
          slug: payload.slug || undefined,
          description: payload.description,
          price: payload.price,
          salePrice: payload.salePrice,
          stock: payload.stock,
          inStock: typeof payload.inStock === "boolean" ? payload.inStock : true,
          category: payload.category,
          material: payload.material,
          colours: payload.colours,
          images: payload.images,
          collection: payload.collection || null,
          featured: payload.featured ?? false,
        },
      },
      { new: true },
    ).lean();

    if (!updatedProduct || typeof updatedProduct !== "object" || !("_id" in updatedProduct)) {
      return apiError("Product not found.", { status: 404 });
    }

    return apiSuccess({
      product: serializeProduct(updatedProduct),
      message: "Product updated successfully.",
    });
  } catch {
    return apiError("Unable to update product.", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return apiError("Product not found.", { status: 404 });
    }

    await connectToDatabase();

    const Product = getProductModel();
    const deletedProduct = await Product.findByIdAndDelete(id).lean();

    if (!deletedProduct || typeof deletedProduct !== "object" || !("_id" in deletedProduct)) {
      return apiError("Product not found.", { status: 404 });
    }

    return apiSuccess({
      message: "Product deleted successfully.",
    });
  } catch {
    return apiError("Unable to delete product.", { status: 500 });
  }
}
