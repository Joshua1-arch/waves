import { BestSellers } from "@/components/sections/BestSellers";
import { BrandValues } from "@/components/sections/BrandValues";
import { FeaturedCollections } from "@/components/sections/FeaturedCollections";
import { Hero } from "@/components/sections/Hero";
import { LifestyleBanner } from "@/components/sections/LifestyleBanner";
import { Newsletter } from "@/components/sections/Newsletter";
import { PageTransition } from "@/components/ui/PageTransition";
import { DEFAULT_PAGE_CONTENT, getPublicContentUrl } from "@/lib/page-content";
import { getFeaturedCollections, getFeaturedProducts } from "@/lib/store-data";

export const revalidate = 60;

async function fetchHomeContent() {
  const fallback = DEFAULT_PAGE_CONTENT.home;

  try {
    const response = await fetch(getPublicContentUrl("home"), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as {
      data?: {
        sections?: Record<string, string>;
      };
    };

    return {
      ...fallback,
      ...payload.data?.sections,
    };
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [content, featuredCollections, featuredProducts] = await Promise.all([
    fetchHomeContent(),
    getFeaturedCollections(),
    getFeaturedProducts(),
  ]);

  return (
    <PageTransition>
      <Hero
        headline={content.hero_headline}
        subheadline={content.hero_subheadline}
        ctaText={content.hero_cta_text}
      />
      <FeaturedCollections
        title={content.featured_section_title}
        collections={featuredCollections}
      />
      <LifestyleBanner
        headline={content.brand_story_headline}
        body={content.brand_story_body}
      />
      <BestSellers
        title={content.bestsellers_section_title}
        products={featuredProducts}
      />
      <BrandValues />
      <Newsletter
        headline={content.newsletter_headline}
        subtext={content.newsletter_subtext}
      />
    </PageTransition>
  );
}
