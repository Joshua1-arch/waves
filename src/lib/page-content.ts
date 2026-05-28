import { connectToDatabase } from "@/lib/mongodb";
import { getPageContentModel } from "@/lib/models/PageContent";

export interface PageContentMap {
  [key: string]: string;
}

export interface PageContentResult {
  slug: string;
  sections: PageContentMap;
  updatedAt: string | null;
}

export const DEFAULT_PAGE_CONTENT: Record<string, PageContentMap> = {
  home: {
    hero_headline: "See the World Differently",
    hero_subheadline: "Architectural precision in every detail",
    hero_cta_text: "Shop Collection",
    featured_section_title: "Featured Collections",
    bestsellers_section_title: "Best Sellers",
    brand_story_headline: "Crafted With Intention",
    brand_story_body:
      "Wave & Co. creates architectural eyewear defined by precision, material clarity, and enduring form.",
    newsletter_headline: "Join The Collective",
    newsletter_subtext:
      "Receive exclusive access to new releases and curated content from the studio.",
  },
  about: {
    headline: "We Are Wave & Co.",
    subheadline: "Architectural precision in every detail",
    story:
      "Wave & Co. was born from a belief that eyewear should reflect the rigor, proportion, and restraint of architecture.",
    mission:
      "We design modern heirlooms that balance structural discipline, quiet luxury, and lasting utility.",
  },
  contact: {
    headline: "Get In Touch",
    email: "hello@waveandco.com",
    phone: "+1 (000) 000-0000",
    address: "742 Avenue of Architecture, Antwerp, Belgium 2000",
    hours: "Mon–Fri, 10:00 AM – 6:00 PM",
  },
};

export async function getPageContent(
  slug: "home" | "about" | "contact",
): Promise<PageContentResult> {
  const fallbackSections = DEFAULT_PAGE_CONTENT[slug] ?? {};

  try {
    await connectToDatabase();

    const PageContent = getPageContentModel();
    const document: unknown = await PageContent.findOne({ slug }).lean();

    if (!document || typeof document !== "object") {
      return {
        slug,
        sections: fallbackSections,
        updatedAt: null,
      };
    }

    const documentRecord = document as Record<string, unknown>;

    const rawSections = Array.isArray(documentRecord.sections)
      ? documentRecord.sections
      : null;

    const sectionEntries = rawSections
      ? rawSections.flatMap((section: unknown) => {
          if (!section || typeof section !== "object") {
            return [];
          }

          const entry = section as Record<string, unknown>;

          if (typeof entry.key !== "string" || typeof entry.value !== "string") {
            return [];
          }

          return [[entry.key, entry.value] as const];
        })
      : [];

    const databaseSections = Object.fromEntries(sectionEntries);

    return {
      slug,
      sections: {
        ...fallbackSections,
        ...databaseSections,
      },
      updatedAt:
        documentRecord.updatedAt instanceof Date
          ? documentRecord.updatedAt.toISOString()
          : null,
    };
  } catch {
    return {
      slug,
      sections: fallbackSections,
      updatedAt: null,
    };
  }
}

export function getPublicContentUrl(slug: "home" | "about" | "contact") {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined.");
  }

  return `${baseUrl}/api/content/${slug}`;
}
