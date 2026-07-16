import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TloraCmsMediaAsset } from "@/types/scope";

type MediaRow = {
  id: string;
  storage_path: string;
  public_url: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_at: string;
};

const mapMedia = (row: MediaRow): TloraCmsMediaAsset => ({
  id: row.id,
  storagePath: row.storage_path,
  publicUrl: row.public_url,
  fileName: row.file_name,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  width: row.width,
  height: row.height,
  altText: row.alt_text,
  createdAt: row.created_at,
});

export async function listTloraMedia(studioId: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_media_assets")
    .select("id,storage_path,public_url,file_name,mime_type,size_bytes,width,height,alt_text,created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapMedia(row as MediaRow));
}

export async function createTloraMedia(input: {
  studioId: string;
  userId: string;
  storagePath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tlora_cms_media_assets").insert({
    studio_id: input.studioId,
    storage_path: input.storagePath,
    public_url: input.publicUrl,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    alt_text: input.altText || null,
    created_by: input.userId,
  }).select("id,storage_path,public_url,file_name,mime_type,size_bytes,width,height,alt_text,created_at").single();
  if (error) throw error;
  return mapMedia(data as MediaRow);
}

export async function deleteTloraMedia(studioId: string, mediaId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tlora_cms_media_assets")
    .select("storage_bucket,storage_path")
    .eq("id", mediaId)
    .eq("studio_id", studioId)
    .single();
  if (error) throw error;
  const { error: storageError } = await admin.storage.from(data.storage_bucket).remove([data.storage_path]);
  if (storageError) throw storageError;
  const { error: deleteError } = await admin.from("tlora_cms_media_assets").delete().eq("id", mediaId).eq("studio_id", studioId);
  if (deleteError) throw deleteError;
}

