import { AboutPageClient } from "@/components/sections/AboutPageClient";
import { DEFAULT_PAGE_CONTENT, getPageContent } from "@/lib/page-content";

export const revalidate = 60;

export default async function AboutPage() {
  const fallback = DEFAULT_PAGE_CONTENT.about as {
    headline: string;
    subheadline: string;
    story: string;
    mission: string;
  };

  let content = fallback;

  try {
    const result = await getPageContent("about");
    content = {
      ...fallback,
      ...result.sections,
    };
  } catch {
    content = fallback;
  }

  return <AboutPageClient content={content} />;
}
