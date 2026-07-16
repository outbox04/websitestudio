import { NextResponse } from "next/server";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraCmsPage, publishTloraPage, updateTloraSectionDraft } from "@/repositories/tlora/cms-repository";
import { publishPageSchema, updateSectionSchema } from "@/schemas/tlora-cms";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const pageKey = new URL(request.url).searchParams.get("pageKey") || "home";
    return NextResponse.json(await getTloraCmsPage(context.studio.id, pageKey));
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = updateSectionSchema.parse(await request.json());
    const section = await updateTloraSectionDraft({
      studioId: context.studio.id,
      userId: context.userId!,
      sectionId: input.sectionId,
      sectionType: input.sectionType,
      content: input.content,
      isEnabled: input.isEnabled,
    });
    return NextResponse.json({ section });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = publishPageSchema.parse(await request.json());
    await publishTloraPage(context.studio.id, context.userId!, input.pageId, input.changeNote);
    return NextResponse.json({ published: true });
  } catch (error) {
    return tloraApiError(error);
  }
}
