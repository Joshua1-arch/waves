import { apiSuccess } from "@/lib/api-response";
import { getPageContent } from "@/lib/page-content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (slug !== "home" && slug !== "about" && slug !== "contact") {
    return Response.json(
      {
        success: false,
        error: "Content not found.",
      },
      { status: 404 },
    );
  }

  const content = await getPageContent(slug);

  return apiSuccess(content);
}
