import { ProductDetail } from "@/components/shop/ProductDetail";
import { PageTransition } from "@/components/ui/PageTransition";
import { getProductBySlug, products } from "@/lib/products";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <ProductDetail product={product} />
      </div>
    </PageTransition>
  );
}
