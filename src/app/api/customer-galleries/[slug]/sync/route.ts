import { NextResponse } from "next/server";
import { listDriveImages } from "@/lib/google-drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext } from "@/lib/studio-admin";
import { getStudioDriveClient, getStudioDriveConnection } from "@/lib/studio-google-drive";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const auth = await checkAuthContext(request);
  if (auth.errorResponse) return auth.errorResponse;
  const { isPlatformAdmin, context } = auth;

  const supabase = createAdminClient();

  let query = supabase
    .from("customer_galleries")
    .select("*")
    .eq("customer_name_slug", slug);

  if (context) {
    query = query.eq("studio_id", context.studioId);
  } else if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: gallery, error: galleryError } = await query.maybeSingle();

  if (galleryError || !gallery) {
    return NextResponse.json({ error: "Không tìm thấy thư mục khách hàng" }, { status: 404 });
  }

  let connection = null;
  const studioId = gallery.studio_id || context?.studioId;
  if (studioId) {
    try {
      connection = await getStudioDriveConnection(studioId);
    } catch {}
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !connection || connection.root_folder_id.startsWith("mock-")) {
    await supabase
      .from("customer_gallery_photos")
      .delete()
      .eq("gallery_id", gallery.id)
      .like("drive_file_id", "mock-%");

    return NextResponse.json(
      { error: "Google Drive chưa được kết nối cho studio này nên không thể đồng bộ ảnh thật." },
      { status: 400 },
    );
  }

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

      if (error) throw error;
    }

    return NextResponse.json({ rawCount: rawPhotos.length, editedCount: editedPhotos.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đồng bộ được ảnh từ Google Drive" },
      { status: 500 },
    );
  }
}
