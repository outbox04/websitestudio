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
    } catch (err) {}
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !connection || connection.root_folder_id.startsWith("mock-")) {
    try {
      const mockPhotos = [];
      const imgIds = [
        "1524504388940-b1c1722653e1",
        "1512316609839-ce289d3eba0a",
        "1509967419530-da38b4704bc6",
        "1509631179647-0177331693ae",
        "1494790108377-be9c29b29330",
        "1534528741775-53994a69daeb"
      ];
      
      for (let i = 1; i <= 6; i++) {
        mockPhotos.push({
          gallery_id: gallery.id,
          drive_file_id: `mock-file-raw-${i}`,
          file_name: `DSC_900${i}.JPG`,
          thumbnail_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=300&q=80`,
          preview_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=1200&q=85`,
          download_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=2400&q=100`,
          kind: "raw",
        });
      }
      
      for (let i = 1; i <= 2; i++) {
        mockPhotos.push({
          gallery_id: gallery.id,
          drive_file_id: `mock-file-edited-${i}`,
          file_name: `DSC_900${i}_edited.JPG`,
          thumbnail_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=300&q=80`,
          preview_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=1200&q=85`,
          download_url: `https://images.unsplash.com/photo-${imgIds[i-1]}?auto=format&fit=crop&w=2400&q=100`,
          kind: "edited",
        });
      }

      if (mockPhotos.length > 0) {
        const { error } = await supabase
          .from("customer_gallery_photos")
          .upsert(mockPhotos, { onConflict: "gallery_id,drive_file_id" });
        if (error) throw error;
      }
      return NextResponse.json({ rawCount: 6, editedCount: 2 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "Không đồng bộ được ảnh mẫu." }, { status: 500 });
    }
  }

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
