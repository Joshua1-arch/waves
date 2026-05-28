import { ContactPageClient } from "@/components/sections/ContactPageClient";
import { DEFAULT_PAGE_CONTENT, getPublicContentUrl } from "@/lib/page-content";

export const revalidate = 60;

async function fetchContactContent(): Promise<{
  headline: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
}> {
  const fallback = DEFAULT_PAGE_CONTENT.contact as {
    headline: string;
    email: string;
    phone: string;
    address: string;
    hours: string;
  };

  try {
    const response = await fetch(getPublicContentUrl("contact"), {
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

export default async function ContactPage() {
  const content = await fetchContactContent();

  return <ContactPageClient content={content} />;
}
