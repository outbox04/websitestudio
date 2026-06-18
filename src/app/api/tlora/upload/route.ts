import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorMessage, isAuthorized, json, options, unauthorized } from "@/lib/tlora-api";
import { uploadDriveImage } from "@/lib/google-drive";

export const runtime = "nodejs";

type TloraUploadKind = "raw" | "edited";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const formData = await request.formData();
    const albumName = String(formData.get("albumName") || "").trim();
    const kind = String(formData.get("kind") || "").trim() as TloraUploadKind;
    const file = formData.get("file");

    if (!albumName) {
      return json({ error: "albumName is required" }, { status: 400 });
    }

    if (kind !== "raw" && kind !== "edited") {
      return json({ error: "kind must be raw or edited" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return json({ error: "file is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const slug = createSlug(albumName);
    const { data: gallery, error: galleryError } = await supabase
      .from("customer_galleries")
      .select("id,customer_name,customer_name_slug,raw_drive_folder_id,edited_drive_folder_id")
      .or(`customer_name_slug.eq.${slug},customer_name.eq.${albumName}`)
      .maybeSingle();

    if (galleryError) {
      throw galleryError;
    }

    if (!gallery) {
      return json({ error: "Gallery not found" }, { status: 404 });
    }

    const folderId = kind === "raw" ? gallery.raw_drive_folder_id : gallery.edited_drive_folder_id;
    if (!folderId) {
      return json({ error: "Drive folder not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadDriveImage(folderId, file.name, buffer, file.type || "image/jpeg");

    const { error } = await supabase.from("customer_gallery_photos").upsert(
      {
        gallery_id: gallery.id,
        drive_file_id: uploaded.id,
        file_name: uploaded.name,
        thumbnail_url: uploaded.thumbnailLink || null,
        preview_url: uploaded.largeThumbnailLink || uploaded.thumbnailLink || null,
        download_url: uploaded.webContentLink || null,
        kind,
      },
      { onConflict: "gallery_id,drive_file_id" },
    );

    if (error) {
      throw error;
    }

    if (kind === "raw") {
      await supabase.from("customer_galleries").update({ raw_download_enabled: true }).eq("id", gallery.id);
    }

    if (kind === "edited") {
      await supabase.from("customer_galleries").update({ edited_download_enabled: true }).eq("id", gallery.id);
    }

    return json({
      ok: true,
      kind,
      file: {
        driveFileId: uploaded.id,
        fileName: uploaded.name,
        thumbnailUrl: uploaded.thumbnailLink,
        previewUrl: uploaded.largeThumbnailLink || uploaded.thumbnailLink,
        downloadUrl: uploaded.webContentLink,
      },
    });
  } catch (error) {
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}
