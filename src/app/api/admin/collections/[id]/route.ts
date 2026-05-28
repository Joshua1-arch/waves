import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { getCollectionModel } from "@/lib/models/Collection";
import { getProductModel } from "@/lib/models/Product";
import { cookies } from "next/headers";
import { Types } from "mongoose";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  return payload.role === "admin" ? payload : null;
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
      return apiError("Collection not found.", { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      coverImage?: string;
    };

    const updates: {
      name?: string;
      description?: string;
      coverImage?: string;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return apiError("Collection name is required.", { status: 400 });
      }

      updates.name = name;
    }

    if (typeof body.description === "string") {
      updates.description = body.description.trim();
    }

    if (typeof body.coverImage === "string") {
      updates.coverImage = body.coverImage.trim();
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No updates provided.", { status: 400 });
    }

    await connectToDatabase();

    const Collection = getCollectionModel();
    const Product = getProductModel();

    if (updates.name) {
      const existingCollection = await Collection.findOne({
        name: updates.name,
        _id: { $ne: id },
      }).lean();

      if (existingCollection) {
        return apiError("A collection with this name already exists.", { status: 409 });
      }
    }

    const updatedCollection = await Collection.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .lean();

    if (!updatedCollection || typeof updatedCollection !== "object") {
      return apiError("Collection not found.", { status: 404 });
    }

    const productCount = await Product.countDocuments({ collection: id });

    return apiSuccess({
      collection: {
        id: String(updatedCollection._id),
        name:
          "name" in updatedCollection && typeof updatedCollection.name === "string"
            ? updatedCollection.name
            : "",
        slug:
          "slug" in updatedCollection && typeof updatedCollection.slug === "string"
            ? updatedCollection.slug
            : "",
        description:
          "description" in updatedCollection &&
          typeof updatedCollection.description === "string"
            ? updatedCollection.description
            : "",
        coverImage:
          "coverImage" in updatedCollection &&
          typeof updatedCollection.coverImage === "string"
            ? updatedCollection.coverImage
            : "",
        productCount,
        createdAt:
          "createdAt" in updatedCollection && updatedCollection.createdAt instanceof Date
            ? updatedCollection.createdAt
            : null,
      },
      message: "Collection updated successfully.",
    });
  } catch {
    return apiError("Unable to update collection.", { status: 500 });
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
      return apiError("Collection not found.", { status: 404 });
    }

    await connectToDatabase();

    const Collection = getCollectionModel();
    const Product = getProductModel();

    const productCount = await Product.countDocuments({ collection: id });

    if (productCount > 0) {
      return apiError("Cannot delete a collection that still has products.", {
        status: 409,
      });
    }

    const deletedCollection = await Collection.findByIdAndDelete(id).lean();

    if (!deletedCollection) {
      return apiError("Collection not found.", { status: 404 });
    }

    return apiSuccess({
      message: "Collection deleted successfully.",
    });
  } catch {
    return apiError("Unable to delete collection.", { status: 500 });
  }
}
