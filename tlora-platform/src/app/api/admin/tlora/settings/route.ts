import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraSiteSettings, publishTloraSiteSettings, saveTloraSiteSettings } from "@/repositories/tlora/settings-repository";
import { cmsSiteSettingsSchema } from "@/schemas/tlora-cms";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ settings: await getTloraSiteSettings(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const value = cmsSiteSettingsSchema.parse(await request.json());
    return NextResponse.json({ settings: await saveTloraSiteSettings(context.studio.id, context.userId!, value) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ settings: await publishTloraSiteSettings(context.studio.id, context.userId!) });
  } catch (error) {
    return tloraApiError(error);
  }
}

