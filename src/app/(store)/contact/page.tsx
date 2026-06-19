import { ContactPageClient } from "@/components/sections/ContactPageClient";
import { DEFAULT_PAGE_CONTENT, getPageContent } from "@/lib/page-content";

export const revalidate = 60;

export default async function ContactPage() {
  const fallback = DEFAULT_PAGE_CONTENT.contact as {
    headline: string;
    email: string;
    phone: string;
    address: string;
    hours: string;
  };

  let content = fallback;

  try {
    const result = await getPageContent("contact");
    content = {
      ...fallback,
      ...result.sections,
    };
  } catch {
    content = fallback;
  }

  return <ContactPageClient content={content} />;
}
