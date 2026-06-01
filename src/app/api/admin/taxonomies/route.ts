import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { getTaxonomyModel } from "@/lib/models/Taxonomy";
import { cookies } from "next/headers";

const ALLOWED_TYPES = ["category", "material"] as const;

type TaxonomyType = (typeof ALLOWED_TYPES)[number];

interface TaxonomyPayload {
  type?: unknown;
  name?: unknown;
}

interface TaxonomyRecord {
  _id: unknown;
  type: TaxonomyType;
  name: string;
  slug?: string | null;
  createdAt: Date;
}

function isTaxonomyType(value: unknown): value is TaxonomyType {
  return typeof value === "string" && ALLOWED_TYPES.includes(value as TaxonomyType);
}

function isTaxonomyRecord(value: unknown): value is TaxonomyRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const taxonomy = value as Record<string, unknown>;

  return (
    "_id" in taxonomy &&
    isTaxonomyType(taxonomy.type) &&
    typeof taxonomy.name === "string" &&
    taxonomy.createdAt instanceof Date
  );
}

function serializeTaxonomy(taxonomy: TaxonomyRecord) {
  return {
    id: String(taxonomy._id),
    type: taxonomy.type,
    name: taxonomy.name,
    slug: taxonomy.slug ?? "",
    createdAt: taxonomy.createdAt,
  };
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

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!isTaxonomyType(type)) {
      return apiError('Please provide a valid taxonomy type of "category" or "material".', {
        status: 400,
      });
    }

    await connectToDatabase();

    const Taxonomy = getTaxonomyModel();
    const taxonomyDocuments = await Taxonomy.find({ type }).sort({ name: 1, createdAt: -1 }).lean();
    const taxonomies = taxonomyDocuments.filter(isTaxonomyRecord);

    return apiSuccess({
      taxonomies: taxonomies.map(serializeTaxonomy),
    });
  } catch {
    return apiError("Unable to fetch taxonomies.", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = (await request.json()) as TaxonomyPayload;
    const type = body.type;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!isTaxonomyType(type)) {
      return apiError('Please provide a valid taxonomy type of "category" or "material".', {
        status: 400,
      });
    }

    if (!name) {
      return apiError("Taxonomy name is required.", { status: 400 });
    }

    await connectToDatabase();

    const Taxonomy = getTaxonomyModel();
    const existingTaxonomy = await Taxonomy.findOne({ type, name }).lean();

    if (existingTaxonomy) {
      return apiError("A taxonomy with this name already exists.", { status: 409 });
    }

    const createdTaxonomy = await Taxonomy.create({ type, name });

    return apiSuccess(
      {
        taxonomy: serializeTaxonomy({
          _id: createdTaxonomy._id,
          type: createdTaxonomy.type,
          name: createdTaxonomy.name,
          slug: createdTaxonomy.slug,
          createdAt: createdTaxonomy.createdAt,
        }),
        message: `${type === "category" ? "Category" : "Material"} created successfully.`,
      },
      { status: 201 },
    );
  } catch {
    return apiError("Unable to create taxonomy.", { status: 500 });
  }
}
