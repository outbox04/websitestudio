import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorMessage, isAuthorized, json, options, unauthorized } from "@/lib/tlora-api";

export const runtime = "nodejs";

type TloraEditRequestPayload = {
  albumName?: string;
  customerName?: string;
  requested?: number;
  matched?: number;
  missing?: number;
  outputDir?: string;
  doneFile?: string;
  copiedFiles?: string[];
  missingFiles?: string[];
};

function selectedFilesQuery(supabase: ReturnType<typeof createAdminClient>, galleryId: string) {
  return supabase
    .from("customer_gallery_photos")
    .select("file_name,edit_note,selected")
    .eq("gallery_id", galleryId)
    .eq("kind", "raw")
    .or("selected.eq.true,edit_note.not.is.null")
    .order("file_name", { ascending: true });
}

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const albumName = searchParams.get("albumName")?.trim();
  if (!albumName) {
    return json({ error: "albumName is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const slug = createSlug(albumName);
    const { data: gallery, error: galleryError } = await supabase
      .from("customer_galleries")
      .select("id,customer_name,customer_name_slug")
      .or(`customer_name_slug.eq.${slug},customer_name.eq.${albumName}`)
      .maybeSingle();

    if (galleryError) {
      throw galleryError;
    }

    if (!gallery) {
      return json({ files: [], selectedFiles: [], selected_files: [] });
    }

    const { data, error } = await selectedFilesQuery(supabase, gallery.id);
    if (error) {
      throw error;
    }

    const files = [...new Set((data || []).map((photo) => photo.file_name).filter(Boolean))];
    return json({
      ok: true,
      gallery,
      files,
      selectedFiles: files,
      selected_files: files,
      count: files.length,
    });
  } catch (error) {
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const payload = (await request.json()) as TloraEditRequestPayload;
  return json({
    ok: true,
    received: {
      albumName: payload.albumName,
      customerName: payload.customerName,
      requested: payload.requested || 0,
      matched: payload.matched || 0,
      missing: payload.missing || 0,
      outputDir: payload.outputDir,
      doneFile: payload.doneFile,
      copiedFiles: payload.copiedFiles || [],
      missingFiles: payload.missingFiles || [],
    },
  });
}
