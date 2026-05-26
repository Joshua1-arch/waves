import { PageTransition } from "@/components/ui/PageTransition";
import { BestSellers } from "@/components/sections/BestSellers";
import { BrandValues } from "@/components/sections/BrandValues";
import { FeaturedCollections } from "@/components/sections/FeaturedCollections";
import { Hero } from "@/components/sections/Hero";
import { LifestyleBanner } from "@/components/sections/LifestyleBanner";
import { Newsletter } from "@/components/sections/Newsletter";

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <FeaturedCollections />
      <LifestyleBanner />
      <BestSellers />
      <BrandValues />
      <Newsletter />
    </PageTransition>
  );
}
