import { ProductDetail } from "@/components/shop/ProductDetail";
import { PageTransition } from "@/components/ui/PageTransition";
import { connectToDatabase } from "@/lib/mongodb";
import { getProductModel } from "@/lib/models/Product";
import { mapProductDocumentToViewModel } from "@/lib/product-mappers";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  await connectToDatabase();

  const Product = getProductModel();
  const productDocuments = await Product.find({}, { slug: 1, _id: 0 }).lean();

  return productDocuments.flatMap((product) => {
    if (
      product &&
      typeof product === "object" &&
      "slug" in product &&
      typeof product.slug === "string"
    ) {
      return [{ slug: product.slug }];
    }

    return [];
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connectToDatabase();

  const Product = getProductModel();
  const productDocument = await Product.findOne({ slug })
    .populate("collection", "name slug")
    .lean();

  const product = productDocument
    ? mapProductDocumentToViewModel(productDocument)
    : null;

  if (!product) {
    notFound();
  }

  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <ProductDetail product={product} />
      </div>
    </PageTransition>
  );
}
