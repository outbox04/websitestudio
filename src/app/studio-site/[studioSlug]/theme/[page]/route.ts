import { themeResponse } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ studioSlug: string; page: string }> }) {
  const { studioSlug, page } = await params;
  return themeResponse(studioSlug, page);
}
