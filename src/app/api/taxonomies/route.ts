import { apiError, apiSuccess } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { getTaxonomyModel } from "@/lib/models/Taxonomy";

const ALLOWED_TYPES = ["category", "material"] as const;

type TaxonomyType = (typeof ALLOWED_TYPES)[number];

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

export async function GET(request: Request) {
  try {
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
