import { NextResponse } from "next/server";
import { listDriveImages } from "@/lib/google-drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";
import { getStudioDriveClient, getStudioDriveConnection } from "@/lib/studio-google-drive";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createAdminClient();

  const { data: gallery, error: galleryError } = await supabase
    .from("customer_galleries")
    .select("*")
    .eq("studio_id", context.studioId)
    .eq("customer_name_slug", slug)
    .single();

  if (galleryError || !gallery) {
    return NextResponse.json({ error: "Không tìm thấy thư mục khách hàng" }, { status: 404 });
  }

  const connection = await getStudioDriveConnection(context.studioId);
  if (!connection) return NextResponse.json({ error: "Google Drive chưa được kết nối cho studio này." }, { status: 400 });
  const drive = getStudioDriveClient(connection);

  try {
    const [rawPhotos, editedPhotos] = await Promise.all([
      listDriveImages(gallery.raw_drive_folder_id, drive),
      listDriveImages(gallery.edited_drive_folder_id, drive),
    ]);

    const rows = [
      ...rawPhotos.map((photo) => ({
        gallery_id: gallery.id,
        drive_file_id: photo.id,
        file_name: photo.name,
        thumbnail_url: photo.thumbnailLink,
        preview_url: photo.largeThumbnailLink,
        download_url: photo.webContentLink,
        kind: "raw",
      })),
      ...editedPhotos.map((photo) => ({
        gallery_id: gallery.id,
        drive_file_id: photo.id,
        file_name: photo.name,
        thumbnail_url: photo.thumbnailLink,
        preview_url: photo.largeThumbnailLink,
        download_url: photo.webContentLink,
        kind: "edited",
      })),
    ];

    if (rows.length > 0) {
      const { error } = await supabase
        .from("customer_gallery_photos")
        .upsert(rows, { onConflict: "gallery_id,drive_file_id" });

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ rawCount: rawPhotos.length, editedCount: editedPhotos.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đồng bộ được ảnh từ Google Drive" },
      { status: 500 },
    );
  }
}
