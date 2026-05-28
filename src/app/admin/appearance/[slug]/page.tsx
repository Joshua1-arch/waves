"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DEFAULT_PAGE_CONTENT } from "@/lib/page-content";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_META = {
  home: {
    title: "Homepage",
    previewHref: "/",
  },
  about: {
    title: "About Page",
    previewHref: "/about",
  },
  contact: {
    title: "Contact Page",
    previewHref: "/contact",
  },
} as const;

type AppearanceSlug = keyof typeof PAGE_META;
type SectionMap = Record<string, string>;

function isAppearanceSlug(value: string): value is AppearanceSlug {
  return value === "home" || value === "about" || value === "contact";
}

function formatLabel(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isLongTextField(key: string) {
  return key.includes("body") || key.includes("story") || key.includes("mission");
}

export default function AdminAppearanceEditorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  if (!isAppearanceSlug(slug)) {
    notFound();
  }

  const defaults = DEFAULT_PAGE_CONTENT[slug];
  const pageMeta = PAGE_META[slug];

  const [sections, setSections] = useState<SectionMap>(defaults);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      setLoading(true);

      try {
        const response = await fetch(`/api/content/${slug}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load content.");
        }

        const payload = (await response.json()) as {
          data?: {
            sections?: Record<string, string>;
            updatedAt?: string | null;
          };
        };

        if (!active) {
          return;
        }

        setSections({
          ...defaults,
          ...payload.data?.sections,
        });
        setUpdatedAt(payload.data?.updatedAt ?? null);
      } catch {
        if (!active) {
          return;
        }

        setSections(defaults);
        setUpdatedAt(null);
        toast.error("Unable to load appearance content. Showing defaults.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContent();

    return () => {
      active = false;
    };
  }, [defaults, slug]);

  const sectionEntries = useMemo(() => Object.entries(sections), [sections]);

  async function handleSave() {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/content/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sections: sectionEntries.map(([key, value]) => ({ key, value })),
        }),
      });

      const payload = (await response.json()) as {
        data?: {
          updatedAt?: string;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save content.");
      }

      setUpdatedAt(payload.data?.updatedAt ?? new Date().toISOString());
      toast.success("Appearance content saved successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 border border-brand-border bg-brand-white p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/appearance"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-brand-gold">
            {slug}
          </p>
          <h1 className="mt-3 font-serif text-3xl">{pageMeta.title}</h1>
          <p className="mt-2 text-sm text-brand-black/50">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString()}`
              : "Using seeded/default content."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={pageMeta.previewHref} target="_blank" rel="noreferrer">
            <Button variant="outline">Preview</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-8 border border-brand-border bg-brand-white p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse border-b border-brand-border pb-4 last:border-b-0"
              >
                <div className="h-3 w-24 bg-brand-cream" />
                <div className="mt-3 h-10 w-full bg-brand-cream" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {sectionEntries.map(([key, value]) => {
              const label = formatLabel(key);

              return isLongTextField(key) ? (
                <Textarea
                  key={key}
                  label={label}
                  value={value}
                  onChange={(event) =>
                    setSections((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              ) : (
                <Input
                  key={key}
                  label={label}
                  value={value}
                  underline={false}
                  onChange={(event) =>
                    setSections((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
