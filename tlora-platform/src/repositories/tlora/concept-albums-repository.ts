import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TloraConceptAlbum } from "@/types/scope";

type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  images: unknown;
  is_featured: boolean;
  sort_order: number;
  status: TloraConceptAlbum["status"];
  published_at: string | null;
  updated_at: string;
};

const mapAlbum = (row: AlbumRow): TloraConceptAlbum => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  coverImageUrl: row.cover_image_url || "",
  images: Array.isArray(row.images) ? row.images.filter((value): value is string => typeof value === "string") : [],
  isFeatured: row.is_featured,
  sortOrder: row.sort_order,
  status: row.status,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
});

const select = "id,slug,title,excerpt,cover_image_url,images,is_featured,sort_order,status,published_at,updated_at";

export async function listTloraConceptAlbums(studioId: string) {
  const { data, error } = await createAdminClient().from("tlora_concept_albums").select(select).eq("studio_id", studioId).order("sort_order").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapAlbum(row as AlbumRow));
}

export async function listPublishedTloraConceptAlbums(limit?: number) {
  const admin = createAdminClient();
  const { data: studio, error: studioError } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").single();
  if (studioError) throw studioError;
  let query = admin.from("tlora_concept_albums").select(select).eq("studio_id", studio.id).eq("status", "published").order("is_featured", { ascending: false }).order("sort_order").order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => mapAlbum(row as AlbumRow));
}

export async function saveTloraConceptAlbum(studioId: string, userId: string, input: Omit<TloraConceptAlbum, "id" | "publishedAt" | "updatedAt"> & { id?: string }) {
  const admin = createAdminClient();
  if (input.isFeatured) {
    let featuredQuery = admin.from("tlora_concept_albums").select("id", { count: "exact", head: true }).eq("studio_id", studioId).eq("is_featured", true);
    if (input.id) featuredQuery = featuredQuery.neq("id", input.id);
    const { count } = await featuredQuery;
    if ((count || 0) >= 6) throw new Error("Chỉ được chọn tối đa 6 album nổi bật.");
  }
  const values = {
    studio_id: studioId,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    cover_image_url: input.coverImageUrl || null,
    images: input.images,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
    updated_by: userId,
  };
  const query = input.id
    ? admin.from("tlora_concept_albums").update(values).eq("id", input.id).eq("studio_id", studioId)
    : admin.from("tlora_concept_albums").insert({ ...values, created_by: userId });
  const { data, error } = await query.select(select).single();
  if (error) throw error;
  const album = mapAlbum(data as AlbumRow);
  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId, actor_user_id: userId, action: input.id ? "concept_album.updated" : "concept_album.created",
    entity_type: "concept_album", entity_id: album.id, after_value: data,
  });
  return album;
}

export async function deleteTloraConceptAlbum(studioId: string, albumId: string) {
  const { error } = await createAdminClient().from("tlora_concept_albums").delete().eq("id", albumId).eq("studio_id", studioId);
  if (error) throw error;
}
