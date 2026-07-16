import { NextResponse } from "next/server";
import { studioIdForHeaders } from "@/lib/customer-gallery-scope";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const { selected, editNote } = (await request.json()) as {
    selected?: boolean;
    editNote?: string;
  };

  const patch: { selected?: boolean; edit_note?: string } = {};

  if (typeof selected === "boolean") {
    patch.selected = selected;
  }

  if (typeof editNote === "string") {
    patch.edit_note = editNote;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { studioId } = await studioIdForHeaders(request.headers);
  let photoQuery = supabase
    .from("customer_gallery_photos")
    .select("id,customer_galleries!inner(studio_id)")
    .eq("id", photoId);

  photoQuery = photoQuery.eq("customer_galleries.studio_id", studioId);

  const { data: allowedPhoto, error: allowedError } = await photoQuery.maybeSingle();
  if (allowedError || !allowedPhoto) {
    return NextResponse.json({ error: "Không tìm thấy ảnh." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("customer_gallery_photos")
    .update(patch)
    .eq("id", photoId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photo: data });
}
