import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { DEFAULT_PAGE_CONTENT } from "@/lib/page-content";
import { getPageContentModel } from "@/lib/models/PageContent";
import { cookies } from "next/headers";

interface SectionInput {
  key: string;
  value: string;
}

function isAllowedSlug(value: string): value is "home" | "about" | "contact" {
  return value === "home" || value === "about" || value === "contact";
}

function normalizeSections(
  sections: unknown,
  slug: "home" | "about" | "contact",
): SectionInput[] | null {
  if (!Array.isArray(sections)) {
    return null;
  }

  const allowedKeys = new Set(Object.keys(DEFAULT_PAGE_CONTENT[slug] ?? {}));

  const normalized = sections.flatMap((section) => {
    if (!section || typeof section !== "object") {
      return [];
    }

    const entry = section as Record<string, unknown>;

    if (
      typeof entry.key !== "string" ||
      typeof entry.value !== "string" ||
      !allowedKeys.has(entry.key)
    ) {
      return [];
    }

    return [
      {
        key: entry.key,
        value: entry.value,
      },
    ];
  });

  return normalized.length === allowedKeys.size ? normalized : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!isAllowedSlug(slug)) {
      return apiError("Content not found.", { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const payload = verifyAuthToken(token);

    if (payload.role !== "admin") {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = (await request.json()) as {
      sections?: unknown;
    };

    const sections = normalizeSections(body.sections, slug);

    if (!sections) {
      return apiError("Invalid content payload.", { status: 400 });
    }

    await connectToDatabase();

    const PageContent = getPageContentModel();
    const document: unknown = await PageContent.findOneAndUpdate(
      { slug },
      {
        $set: {
          sections,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      },
    ).lean();

    const rawSections =
      document &&
      typeof document === "object" &&
      "sections" in document &&
      Array.isArray(document.sections)
        ? document.sections
        : null;

    const updatedSections = rawSections
      ? rawSections.flatMap((section: unknown) => {
          if (!section || typeof section !== "object") {
            return [];
          }

          const entry = section as Record<string, unknown>;

          if (typeof entry.key !== "string" || typeof entry.value !== "string") {
            return [];
          }

          return [
            {
              key: entry.key,
              value: entry.value,
            },
          ];
        })
      : sections;

    return apiSuccess({
      slug,
      sections: updatedSections,
      updatedAt:
        document &&
        typeof document === "object" &&
        "updatedAt" in document &&
        document.updatedAt instanceof Date
          ? document.updatedAt.toISOString()
          : new Date().toISOString(),
    });
  } catch {
    return apiError("Unable to update appearance content.", { status: 500 });
  }
}
