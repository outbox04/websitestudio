import { NextResponse } from "next/server";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { listDriveImages, listPublicDriveImages } from "@/lib/google-drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext } from "@/lib/studio-admin";
import { getStudioDriveClient, getStudioDriveConnection } from "@/lib/studio-google-drive";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const auth = await checkAuthContext(request, { allowTlora: true });
  const canUseStudioConnection = !auth.errorResponse;
  const { isPlatformAdmin, context } = auth;

  const supabase = createAdminClient();

  const scoped = await scopedGalleryQuery(request.headers, slug);
  let query = scoped.query;

  if (context && scoped.studioId === context.studioId) {
    query = query.eq("studio_id", context.studioId);
  } else if (canUseStudioConnection && !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: gallery, error: galleryError } = await query.maybeSingle();

  if (galleryError || !gallery) {
    return NextResponse.json({ error: "Không tìm thấy thư mục khách hàng" }, { status: 404 });
  }

  let connection = null;
  const studioId = gallery.studio_id || context?.studioId;
  if (studioId && canUseStudioConnection) {
    try {
      connection = await getStudioDriveConnection(studioId);
    } catch {}
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !connection || connection.root_folder_id.startsWith("mock-")) {
    try {
      const [rawPhotos, editedPhotos] = await Promise.all([
        listPublicDriveImages(gallery.raw_drive_folder_id),
        listPublicDriveImages(gallery.edited_drive_folder_id),
      ]);

      const result = await upsertSyncedPhotos(supabase, gallery.id, rawPhotos, editedPhotos);
      return NextResponse.json({ rawCount: rawPhotos.length, editedCount: editedPhotos.length, ...result });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Không đồng bộ được ảnh từ Google Drive public folder" },
        { status: 400 },
      );
    }
  }

  const drive = getStudioDriveClient(connection);

  try {
    const [rawPhotos, editedPhotos] = await Promise.all([
      listDriveImages(gallery.raw_drive_folder_id, drive),
      listDriveImages(gallery.edited_drive_folder_id, drive),
    ]);

    const result = await upsertSyncedPhotos(supabase, gallery.id, rawPhotos, editedPhotos);

    return NextResponse.json({ rawCount: rawPhotos.length, editedCount: editedPhotos.length, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đồng bộ được ảnh từ Google Drive" },
      { status: 500 },
    );
  }
}

async function upsertSyncedPhotos(
  supabase: ReturnType<typeof createAdminClient>,
  galleryId: string,
  rawPhotos: Awaited<ReturnType<typeof listDriveImages>>,
  editedPhotos: Awaited<ReturnType<typeof listDriveImages>>,
) {
  const rows = [
    ...rawPhotos.map((photo) => ({
      gallery_id: galleryId,
      drive_file_id: photo.id,
      file_name: photo.name,
      thumbnail_url: photo.thumbnailLink,
      preview_url: photo.largeThumbnailLink,
      download_url: photo.webContentLink,
      kind: "raw",
    })),
    ...editedPhotos.map((photo) => ({
      gallery_id: galleryId,
      drive_file_id: photo.id,
      file_name: photo.name,
      thumbnail_url: photo.thumbnailLink,
      preview_url: photo.largeThumbnailLink,
      download_url: photo.webContentLink,
      kind: "edited",
    })),
  ];

  const { data: existingRows, error: existingError } = await supabase
    .from("customer_gallery_photos")
    .select("drive_file_id")
    .eq("gallery_id", galleryId);

  if (existingError) throw existingError;

  const existingIds = new Set((existingRows || []).map((photo) => photo.drive_file_id));
  const newRawCount = rawPhotos.filter((photo) => !existingIds.has(photo.id)).length;
  const newEditedCount = editedPhotos.filter((photo) => !existingIds.has(photo.id)).length;

  if (rows.length > 0) {
    const { error } = await supabase
      .from("customer_gallery_photos")
      .upsert(rows, { onConflict: "gallery_id,drive_file_id" });

    if (error) throw error;
  }

  const { data: photos, error: photosError } = await supabase
    .from("customer_gallery_photos")
    .select("*")
    .eq("gallery_id", galleryId)
    .not("drive_file_id", "like", "mock-%")
    .order("file_name", { ascending: true });

  if (photosError) throw photosError;

  return { newRawCount, newEditedCount, photos: photos || [] };
}
