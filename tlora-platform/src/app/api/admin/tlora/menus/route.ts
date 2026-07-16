import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraMenu, replaceTloraMenuItems } from "@/repositories/tlora/menus-repository";
import { cmsMenuSchema } from "@/schemas/tlora-cms";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ menu: await getTloraMenu(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = cmsMenuSchema.parse(await request.json());
    return NextResponse.json({ menu: await replaceTloraMenuItems(context.studio.id, context.userId!, input.menuId, input.items) });
  } catch (error) {
    return tloraApiError(error);
  }
}

