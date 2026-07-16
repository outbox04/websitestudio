import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { studioIdForHeaders } from "@/lib/customer-gallery-scope";
import { getDriveClient } from "@/lib/google-drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryTokenFromUrl } from "@/lib/gallery-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, " ").trim() || "image";
}

export async function GET(request: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const supabase = createAdminClient();
  const { studioId } = await studioIdForHeaders(request.headers);
  let query = supabase
    .from("customer_gallery_photos")
    .select("drive_file_id,file_name,kind,customer_galleries!inner(raw_download_enabled,edited_download_enabled,studio_id,share_token)")
    .eq("id", photoId);

  query = query
    .eq("customer_galleries.studio_id", studioId)
    .eq("customer_galleries.share_token", galleryTokenFromUrl(request.url));
  const { data: photo, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const gallery = Array.isArray(photo.customer_galleries) ? photo.customer_galleries[0] : photo.customer_galleries;
  const enabled = photo.kind === "raw" ? gallery?.raw_download_enabled : gallery?.edited_download_enabled;

  if (!enabled) {
    return NextResponse.json({ error: "Download is locked" }, { status: 403 });
  }

  const drive = getDriveClient();
  const response = await drive.files.get({ fileId: photo.drive_file_id, alt: "media" }, { responseType: "stream" });
  const mimeType = response.headers["content-type"] || "application/octet-stream";

  return new NextResponse(Readable.toWeb(response.data) as ReadableStream, {
    headers: {
      "Content-Type": Array.isArray(mimeType) ? mimeType[0] : mimeType,
      "Content-Disposition": `attachment; filename="${safeFileName(photo.file_name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
