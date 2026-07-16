import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { deleteTloraConceptAlbum, listTloraConceptAlbums, saveTloraConceptAlbum } from "@/repositories/tlora/concept-albums-repository";
import { conceptAlbumSchema } from "@/schemas/tlora-cms";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ albums: await listTloraConceptAlbums(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = conceptAlbumSchema.parse(await request.json());
    const album = await saveTloraConceptAlbum(context.studio.id, context.userId!, input);
    return NextResponse.json({ album });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Thiếu album id." }, { status: 400 });
    await deleteTloraConceptAlbum(context.studio.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return tloraApiError(error);
  }
}
