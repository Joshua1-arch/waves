import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { getProductModel } from "@/lib/models/Product";
import { getTaxonomyModel } from "@/lib/models/Taxonomy";
import { cookies } from "next/headers";
import { Types } from "mongoose";

interface CreateProductBody {
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

async function taxonomyExists(type: "category" | "material", name: string) {
  const Taxonomy = getTaxonomyModel();
  const taxonomy = await Taxonomy.findOne({ type, name }).lean();
  return Boolean(taxonomy);
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = (await request.json()) as CreateProductBody;

    const name = toTrimmedString(body.name);
    const slug = toTrimmedString(body.slug);
    const description = toTrimmedString(body.description);
    const price = toNumber(body.price);
    const salePrice =
      body.salePrice === null || typeof body.salePrice === "undefined"
        ? null
        : toNumber(body.salePrice);
    const stock = toNumber(body.stock);
    const category = toTrimmedString(body.category);
    const material = toTrimmedString(body.material);
    const colours = Array.from(new Set(toStringArray(body.colours)));
    const images = Array.from(new Set(toStringArray(body.images)));
    const featured = Boolean(body.featured);
    const inStock = typeof body.inStock === "boolean" ? body.inStock : true;
    const collection = toTrimmedString(body.collection);

    if (!name) {
      return apiError("Product name is required.", { status: 400 });
    }

    if (price === null || price < 0) {
      return apiError("Price must be a valid number greater than or equal to 0.", {
        status: 400,
      });
    }

    if (salePrice !== null && salePrice < 0) {
      return apiError("Sale price must be greater than or equal to 0.", {
        status: 400,
      });
    }

    if (salePrice !== null && salePrice > price) {
      return apiError("Sale price cannot be greater than the regular price.", {
        status: 400,
      });
    }

    if (stock === null || stock < 0 || !Number.isInteger(stock)) {
      return apiError("Stock must be a whole number greater than or equal to 0.", {
        status: 400,
      });
    }

    if (!category) {
      return apiError("Please select a category.", { status: 400 });
    }

    if (!material) {
      return apiError("Please select a material.", { status: 400 });
    }

    if (images.length === 0) {
      return apiError("At least one product image is required.", { status: 400 });
    }

    if (collection && !Types.ObjectId.isValid(collection)) {
      return apiError("Please select a valid collection.", { status: 400 });
    }

    await connectToDatabase();

    const Product = getProductModel();

    const [categoryExists, materialExists] = await Promise.all([
      taxonomyExists("category", category),
      taxonomyExists("material", material),
    ]);

    if (!categoryExists) {
      return apiError("Please select a valid category.", { status: 400 });
    }

    if (!materialExists) {
      return apiError("Please select a valid material.", { status: 400 });
    }

    const duplicateQuery = slug ? { slug } : { name };
    const existingProduct = await Product.findOne(duplicateQuery).lean();

    if (existingProduct) {
      return apiError(
        slug
          ? "A product with this permalink already exists."
          : "A product with this name already exists.",
        { status: 409 },
      );
    }

    const createdProduct = await Product.create({
      name,
      slug: slug || undefined,
      description,
      price,
      salePrice,
      stock,
      inStock,
      category,
      material,
      colours,
      images,
      collection: collection || null,
      featured,
    });

    return apiSuccess(
      {
        product: {
          id: String(createdProduct._id),
          name: createdProduct.name,
          slug: createdProduct.slug,
          description: createdProduct.description,
          price: createdProduct.price,
          salePrice: createdProduct.salePrice ?? null,
          stock: createdProduct.stock,
          inStock: createdProduct.inStock,
          category: createdProduct.category,
          material: createdProduct.material,
          colours: createdProduct.colours,
          images: createdProduct.images,
          collection: createdProduct.collection ? String(createdProduct.collection) : null,
          featured: createdProduct.featured,
          createdAt: createdProduct.createdAt,
        },
        message: "Product created successfully.",
      },
      { status: 201 },
    );
  } catch {
    return apiError("Unable to create product.", { status: 500 });
  }
}
