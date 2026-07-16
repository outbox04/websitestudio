import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TloraConceptAlbum, TloraConceptCategory } from "@/types/scope";

type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  images: unknown;
  category_id: string | null;
  tlora_concept_categories: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
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
  categoryId: row.category_id,
  categoryName: (Array.isArray(row.tlora_concept_categories) ? row.tlora_concept_categories[0]?.name : row.tlora_concept_categories?.name) || null,
  categorySlug: (Array.isArray(row.tlora_concept_categories) ? row.tlora_concept_categories[0]?.slug : row.tlora_concept_categories?.slug) || null,
  isFeatured: row.is_featured,
  sortOrder: row.sort_order,
  status: row.status,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
});

const select = "id,slug,title,excerpt,cover_image_url,images,category_id,is_featured,sort_order,status,published_at,updated_at,tlora_concept_categories(name,slug)";

export async function listTloraConceptAlbums(studioId: string) {
  const { data, error } = await createAdminClient().from("tlora_concept_albums").select(select).eq("studio_id", studioId).order("sort_order").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapAlbum(row as AlbumRow));
}

export async function listPublishedTloraConceptAlbums(limit?: number) {
  const admin = createAdminClient();
  const { data: studio, error: studioError } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").single();
  if (studioError) throw studioError;
  let query = admin.from("tlora_concept_albums").select(select).eq("studio_id", studio.id).eq("status", "published").order("sort_order").order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => mapAlbum(row as AlbumRow));
}

export async function saveTloraConceptAlbum(studioId: string, userId: string, input: {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  images: string[];
  categoryId?: string | null;
}) {
  const admin = createAdminClient();
  const { data: current } = input.id
    ? await admin.from("tlora_concept_albums").select("sort_order").eq("id", input.id).eq("studio_id", studioId).maybeSingle()
    : { data: null };
  const { data: last } = current
    ? { data: null }
    : await admin.from("tlora_concept_albums").select("sort_order").eq("studio_id", studioId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const values = {
    studio_id: studioId,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    cover_image_url: input.coverImageUrl || null,
    images: input.images,
    category_id: input.categoryId || null,
    is_featured: false,
    sort_order: current?.sort_order ?? Number(last?.sort_order || 0) + 10,
    status: "published",
    published_at: new Date().toISOString(),
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

type CategoryRow = { id: string; name: string; slug: string };

export async function listTloraConceptCategories(studioId: string): Promise<TloraConceptCategory[]> {
  const admin = createAdminClient();
  const [{ data: categories, error }, { data: albums, error: albumError }] = await Promise.all([
    admin.from("tlora_concept_categories").select("id,name,slug").eq("studio_id", studioId).order("name"),
    admin.from("tlora_concept_albums").select("category_id,images").eq("studio_id", studioId),
  ]);
  if (error) throw error;
  if (albumError) throw albumError;
  return (categories || []).map((category) => {
    const used = (albums || []).filter((album) => album.category_id === category.id);
    return {
      ...(category as CategoryRow),
      albumCount: used.length,
      imageCount: used.reduce((sum, album) => sum + (Array.isArray(album.images) ? album.images.length : 0), 0),
    };
  });
}

export async function listPublishedTloraConceptCategories() {
  const admin = createAdminClient();
  const { data: studio, error: studioError } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").single();
  if (studioError) throw studioError;
  return listTloraConceptCategories(studio.id);
}

export async function saveTloraConceptCategory(studioId: string, userId: string, input: { id?: string; name: string; slug: string }) {
  const admin = createAdminClient();
  const values = { studio_id: studioId, name: input.name, slug: input.slug, updated_at: new Date().toISOString() };
  const query = input.id
    ? admin.from("tlora_concept_categories").update(values).eq("id", input.id).eq("studio_id", studioId)
    : admin.from("tlora_concept_categories").insert({ ...values, created_by: userId });
  const { data, error } = await query.select("id,name,slug").single();
  if (error) throw error;
  return { ...(data as CategoryRow), albumCount: 0, imageCount: 0 };
}

export async function deleteTloraConceptCategory(studioId: string, categoryId: string) {
  const admin = createAdminClient();
  const { count, error: countError } = await admin.from("tlora_concept_albums").select("id", { count: "exact", head: true }).eq("studio_id", studioId).eq("category_id", categoryId);
  if (countError) throw countError;
  if ((count || 0) > 0) throw new Error("Danh mục đang được album sử dụng. Hãy chuyển album sang danh mục khác trước.");
  const { error } = await admin.from("tlora_concept_categories").delete().eq("id", categoryId).eq("studio_id", studioId);
  if (error) throw error;
}
