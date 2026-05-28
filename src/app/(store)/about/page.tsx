import { AboutPageClient } from "@/components/sections/AboutPageClient";
import { DEFAULT_PAGE_CONTENT, getPublicContentUrl } from "@/lib/page-content";

export const revalidate = 60;

async function fetchAboutContent(): Promise<{
  headline: string;
  subheadline: string;
  story: string;
  mission: string;
}> {
  const fallback = DEFAULT_PAGE_CONTENT.about as {
    headline: string;
    subheadline: string;
    story: string;
    mission: string;
  };

  try {
    const response = await fetch(getPublicContentUrl("about"), {
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

export default async function AboutPage() {
  const content = await fetchAboutContent();

  return <AboutPageClient content={content} />;
}
