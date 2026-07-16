import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorMessage, isAuthorized, json, options, unauthorized } from "@/lib/tlora-api";
import { requireTloraStudioId } from "@/lib/tlora-studio";

export const runtime = "nodejs";

type TloraEditedUploadPayload = {
  albumName?: string;
  customerName?: string;
  uploaded?: number;
  skipped?: number;
  destinationDir?: string;
};

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const payload = (await request.json()) as TloraEditedUploadPayload;
  const albumName = payload.albumName?.trim();

  try {
    let gallery = null;
    if (albumName) {
      const supabase = createAdminClient();
      const studioId = await requireTloraStudioId();
      const slug = createSlug(albumName);
      const { data, error } = await supabase
        .from("customer_galleries")
        .update({ edited_download_enabled: true })
        .or(`customer_name_slug.eq.${slug},customer_name.eq.${albumName}`)
        .eq("studio_id", studioId)
        .select("id,customer_name,customer_name_slug,edited_download_enabled")
        .maybeSingle();

      if (error) {
        throw error;
      }
      gallery = data;
    }

    return json({
      ok: true,
      gallery,
      uploaded: payload.uploaded || 0,
      skipped: payload.skipped || 0,
      destinationDir: payload.destinationDir,
    });
  } catch (error) {
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}
