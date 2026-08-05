import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateTloraRequest, errorMessage, json, options, unauthorized } from "@/lib/tlora-api";
import { uploadDriveImage } from "@/lib/google-drive";
import { inspectImageBuffer } from "@/lib/image-upload";

export const runtime = "nodejs";

type TloraUploadKind = "raw" | "edited";

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function customerNameFromAlbumName(albumName: string) {
  return albumName.replace(/_\d{2}\.\d{2}$/, "").trim();
}

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateTloraRequest(request);
    if (!auth) return unauthorized();
    const formData = await request.formData();
    const albumName = String(formData.get("albumName") || "").trim();
    const customerName = String(formData.get("customerName") || "").trim();
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
    if (file.size <= 0 || file.size > 25 * 1024 * 1024) {
      return json({ error: "Image must be 25MB or smaller" }, { status: 413 });
    }

    const supabase = createAdminClient();
    const studioId = auth.studioId;
    const lookupNames = uniqueValues([albumName, customerName, customerNameFromAlbumName(albumName)]);
    const lookupSlugs = uniqueValues(lookupNames.map(createSlug));
    const { data: galleryBySlug, error: galleryBySlugError } = await supabase
      .from("customer_galleries")
      .select("id,customer_name,customer_name_slug,raw_drive_folder_id,edited_drive_folder_id")
      .in("customer_name_slug", lookupSlugs)
      .eq("studio_id", studioId)
      .limit(1)
      .maybeSingle();

    if (galleryBySlugError) {
      throw galleryBySlugError;
    }

    const { data: galleryByName, error: galleryByNameError } = galleryBySlug
      ? { data: null, error: null }
      : await supabase
          .from("customer_galleries")
          .select("id,customer_name,customer_name_slug,raw_drive_folder_id,edited_drive_folder_id")
          .in("customer_name", lookupNames)
          .eq("studio_id", studioId)
          .limit(1)
          .maybeSingle();

    if (galleryByNameError) {
      throw galleryByNameError;
    }

    const gallery = galleryBySlug || galleryByName;

    if (!gallery) {
      return json({ error: "Gallery not found", albumName, customerName, lookupNames, lookupSlugs }, { status: 404 });
    }

    const folderId = kind === "raw" ? gallery.raw_drive_folder_id : gallery.edited_drive_folder_id;
    if (!folderId) {
      return json({ error: "Drive folder not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const inspected = inspectImageBuffer(buffer);
    if (!inspected) return json({ error: "Only valid JPEG, PNG and WebP images are supported" }, { status: 415 });
    const uploaded = await uploadDriveImage(folderId, file.name, buffer, inspected.mime);

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
