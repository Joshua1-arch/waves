import { connectToDatabase } from "@/lib/mongodb";
import { getCollectionModel } from "@/lib/models/Collection";
import { getProductModel } from "@/lib/models/Product";
import {
  mapCollectionDocumentToViewModel,
  mapProductDocumentToViewModel,
  type CollectionViewModel,
  type ProductViewModel,
} from "@/lib/product-mappers";

export async function getFeaturedProducts(limit = 4): Promise<ProductViewModel[]> {
  await connectToDatabase();

  const Product = getProductModel();
  const products = await Product.find({ featured: true })
    .populate("collection", "name slug")
    .sort({ createdAt: -1, name: 1 })
    .limit(limit)
    .lean();

  return products
    .map((product) => mapProductDocumentToViewModel(product))
    .filter((product): product is ProductViewModel => product !== null);
}

export async function getFeaturedCollections(limit = 3): Promise<CollectionViewModel[]> {
  await connectToDatabase();

  const Collection = getCollectionModel();
  const collections = await Collection.find({})
    .sort({ createdAt: -1, name: 1 })
    .limit(limit)
    .lean();

  return collections
    .map((collection) => mapCollectionDocumentToViewModel(collection))
    .filter((collection): collection is CollectionViewModel => collection !== null);
}
