import { apiError, apiSuccess } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/mongodb";
import { getProductModel } from "@/lib/models/Product";
import { mapProductDocumentToViewModel } from "@/lib/product-mappers";

export async function GET() {
  try {
    await connectToDatabase();

    const Product = getProductModel();
    const products = await Product.find({})
      .populate("collection", "name slug")
      .sort({ createdAt: -1, name: 1 })
      .lean();

    return apiSuccess({
      products: products
        .map((product) => mapProductDocumentToViewModel(product))
        .filter((product) => product !== null),
    });
  } catch {
    return apiError("Unable to fetch products.", { status: 500 });
  }
}
