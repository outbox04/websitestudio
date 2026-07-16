import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { listTloraCategories, saveTloraCategory } from "@/repositories/tlora/posts-repository";
import { cmsCategorySchema } from "@/schemas/tlora-cms";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ categories: await listTloraCategories(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = cmsCategorySchema.parse(await request.json());
    return NextResponse.json({ category: await saveTloraCategory({ ...input, studioId: context.studio.id }) }, { status: 201 });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = cmsCategorySchema.required({ id: true }).parse(await request.json());
    return NextResponse.json({ category: await saveTloraCategory({ ...input, studioId: context.studio.id }) });
  } catch (error) {
    return tloraApiError(error);
  }
}

