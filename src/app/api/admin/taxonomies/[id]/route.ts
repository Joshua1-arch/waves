import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { getProductModel } from "@/lib/models/Product";
import { getTaxonomyModel } from "@/lib/models/Taxonomy";
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
      return apiError("Taxonomy not found.", { status: 404 });
    }

    await connectToDatabase();

    const Taxonomy = getTaxonomyModel();
    const Product = getProductModel();

    const taxonomy = await Taxonomy.findById(id).lean();

    if (!taxonomy || typeof taxonomy !== "object" || !("_id" in taxonomy)) {
      return apiError("Taxonomy not found.", { status: 404 });
    }

    const taxonomyType = "type" in taxonomy && typeof taxonomy.type === "string" ? taxonomy.type : null;
    const taxonomyName = "name" in taxonomy && typeof taxonomy.name === "string" ? taxonomy.name : null;

    if (!taxonomyType || !taxonomyName || !["category", "material"].includes(taxonomyType)) {
      return apiError("Taxonomy not found.", { status: 404 });
    }

    const usageQuery = taxonomyType === "category" ? { category: taxonomyName } : { material: taxonomyName };
    const productCount = await Product.countDocuments(usageQuery);

    if (productCount > 0) {
      return apiError("Cannot delete a taxonomy that is still used by products.", {
        status: 409,
      });
    }

    await Taxonomy.findByIdAndDelete(id);

    return apiSuccess({
      message: "Taxonomy deleted successfully.",
    });
  } catch {
    return apiError("Unable to delete taxonomy.", { status: 500 });
  }
}
