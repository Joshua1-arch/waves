import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { getCollectionModel } from "@/lib/models/Collection";
import { getProductModel } from "@/lib/models/Product";
import { cookies } from "next/headers";

interface CollectionRecord {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  createdAt: Date;
}

function isCollectionRecord(value: unknown): value is CollectionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const collection = value as Record<string, unknown>;

  return (
    "_id" in collection &&
    typeof collection.name === "string" &&
    typeof collection.slug === "string" &&
    collection.createdAt instanceof Date
  );
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

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    await connectToDatabase();

    const Collection = getCollectionModel();
    const Product = getProductModel();

    const collectionDocuments = await Collection.find({})
      .sort({ createdAt: -1, name: 1 })
      .lean();

    const collections = collectionDocuments.filter(isCollectionRecord);
    const collectionIds = collections.map((collection) => collection._id);

    const productCounts = await Product.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          collection: { $in: collectionIds },
        },
      },
      {
        $group: {
          _id: "$collection",
          count: { $sum: 1 },
        },
      },
    ]);

    const productCountMap = new Map(
      productCounts.map((entry) => [String(entry._id), entry.count]),
    );

    return apiSuccess({
      collections: collections.map((collection) => ({
        id: String(collection._id),
        name: collection.name,
        slug: collection.slug,
        description: collection.description ?? "",
        coverImage: collection.coverImage ?? "",
        productCount: productCountMap.get(String(collection._id)) ?? 0,
        createdAt: collection.createdAt,
      })),
    });
  } catch {
    return apiError("Unable to fetch collections.", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      coverImage?: string;
    };

    const name = body.name?.trim();
    const description = body.description?.trim() ?? "";
    const coverImage = body.coverImage?.trim() ?? "";

    if (!name) {
      return apiError("Collection name is required.", { status: 400 });
    }

    await connectToDatabase();

    const Collection = getCollectionModel();

    const existingCollection = await Collection.findOne({ name }).lean();

    if (existingCollection) {
      return apiError("A collection with this name already exists.", { status: 409 });
    }

    const createdCollection = await Collection.create({
      name,
      description,
      coverImage,
    });

    return apiSuccess(
      {
        collection: {
          id: String(createdCollection._id),
          name: createdCollection.name,
          slug: createdCollection.slug,
          description: createdCollection.description ?? "",
          coverImage: createdCollection.coverImage ?? "",
          productCount: 0,
          createdAt: createdCollection.createdAt,
        },
        message: "Collection created successfully.",
      },
      { status: 201 },
    );
  } catch {
    return apiError("Unable to create collection.", { status: 500 });
  }
}
