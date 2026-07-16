import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import {
  deleteTloraConceptCategory,
  listTloraConceptCategories,
  saveTloraConceptCategory,
} from "@/repositories/tlora/concept-albums-repository";
import { conceptCategorySchema } from "@/schemas/tlora-cms";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ categories: await listTloraConceptCategories(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = conceptCategorySchema.parse(await request.json());
    const category = await saveTloraConceptCategory(context.studio.id, context.userId!, input);
    return NextResponse.json({ category });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Thiếu danh mục id." }, { status: 400 });
    await deleteTloraConceptCategory(context.studio.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return tloraApiError(error);
  }
}
