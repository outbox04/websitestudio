import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorMessage, isAuthorized, json, options, unauthorized } from "@/lib/tlora-api";
import { requireTloraStudioId } from "@/lib/tlora-studio";

export const runtime = "nodejs";

type TloraPhotoKind = "raw" | "edited";

type TloraPhotoPayload = {
  albumName?: string;
  kind?: TloraPhotoKind;
  files?: Array<{
    driveFileId?: string;
    fileName?: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
  }>;
};

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const payload = (await request.json()) as TloraPhotoPayload;
  const albumName = payload.albumName?.trim();
  const kind = payload.kind;

  if (!albumName) {
    return json({ error: "albumName is required" }, { status: 400 });
  }

  if (kind !== "raw" && kind !== "edited") {
    return json({ error: "kind must be raw or edited" }, { status: 400 });
  }

  const files = (payload.files || []).filter((file) => file.driveFileId?.trim() && file.fileName?.trim());
  if (files.length === 0) {
    return json({ error: "files is empty" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const studioId = await requireTloraStudioId();
    const slug = createSlug(albumName);

    const { data: gallery, error: galleryError } = await supabase
      .from("customer_galleries")
      .select("id,customer_name,customer_name_slug")
      .or(`customer_name_slug.eq.${slug},customer_name.eq.${albumName}`)
      .eq("studio_id", studioId)
      .maybeSingle();

    if (galleryError) {
      throw galleryError;
    }

    if (!gallery) {
      return json({ error: "Gallery not found" }, { status: 404 });
    }

    const rows = files.map((file) => ({
      gallery_id: gallery.id,
      drive_file_id: file.driveFileId!.trim(),
      file_name: file.fileName!.trim(),
      thumbnail_url: file.thumbnailUrl || null,
      preview_url: file.previewUrl || null,
      download_url: file.downloadUrl || null,
      kind,
    }));

    const { error } = await supabase
      .from("customer_gallery_photos")
      .upsert(rows, { onConflict: "gallery_id,drive_file_id" });

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
      gallery,
      kind,
      synced: rows.length,
    });
  } catch (error) {
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}
