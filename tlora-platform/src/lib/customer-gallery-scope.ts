import "server-only";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { studioSlugFromHost } from "@/lib/studio-admin";
import { requireTloraStudioId } from "@/lib/tlora-studio";

type HeaderReader = Pick<Headers, "get">;

function requestHost(headers: HeaderReader) {
  return headers.get("x-forwarded-host") || headers.get("host");
}

export async function studioIdForHeaders(headers: HeaderReader) {
  const supabase = createAdminClient();
  const studioSlug = studioSlugFromHost(requestHost(headers));

  if (!studioSlug) {
    return { studioId: await requireTloraStudioId(), studioSlug: null };
  }

  const { data: studio, error } = await supabase
    .from("studios")
    .select("id")
    .eq("slug", studioSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!studio) notFound();

  return { studioId: studio.id as string, studioSlug };
}

export async function scopedGalleryQuery(headers: HeaderReader, customerSlug: string) {
  const supabase = createAdminClient();
  const { studioId, studioSlug } = await studioIdForHeaders(headers);

  let query = supabase
    .from("customer_galleries")
    .select("*")
    .eq("customer_name_slug", customerSlug);

  query = query.eq("studio_id", studioId);

  return { query, studioId, studioSlug };
}

export function driveFolderIdFromUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1]) return idMatch[1];

  return /^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : "";
}

export function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
