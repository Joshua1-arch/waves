import { Button } from "@/components/ui/Button";
import { DEFAULT_PAGE_CONTENT, getPageContent } from "@/lib/page-content";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_CONFIG = [
  {
    slug: "home",
    name: "Homepage",
    previewHref: "/",
  },
  {
    slug: "about",
    name: "About Page",
    previewHref: "/about",
  },
  {
    slug: "contact",
    name: "Contact Page",
    previewHref: "/contact",
  },
] as const;

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Not yet updated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not yet updated";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function fetchAppearanceSummary(
  slug: "home" | "about" | "contact",
): Promise<{ updatedAt: string | null }> {
  const fallback = {
    updatedAt: null,
  };

  try {
    const content = await getPageContent(slug);

    return {
      updatedAt: content.updatedAt,
    };
  } catch {
    return fallback;
  }
}

export default async function AdminAppearancePage() {
  const pages = await Promise.all(
    PAGE_CONFIG.map(async (page) => ({
      ...page,
      sectionCount: Object.keys(DEFAULT_PAGE_CONTENT[page.slug]).length,
      ...(await fetchAppearanceSummary(page.slug)),
    })),
  );

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Appearance</h1>
          <p className="mt-1 text-sm text-brand-black/50">
            Manage public page copy for your storefront.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {pages.map((page) => (
          <div key={page.slug} className="border border-brand-border bg-brand-white p-6">
            <p className="text-[10px] uppercase tracking-widest text-brand-gold">
              {page.slug}
            </p>
            <h2 className="mt-3 font-serif text-2xl">{page.name}</h2>
            <p className="mt-3 text-sm text-brand-black/60">
              Last updated: {formatUpdatedAt(page.updatedAt)}
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-brand-black/40">
              {page.sectionCount} editable sections
            </p>
            <div className="mt-6 flex gap-3">
              <Link href={`/admin/appearance/${page.slug}`}>
                <Button>Edit</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
