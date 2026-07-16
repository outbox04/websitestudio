import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TloraCmsCategory, TloraCmsPost } from "@/types/scope";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  draft_content: { body?: string } | null;
  cover_image_url: string | null;
  keywords: string[] | null;
  status: TloraCmsPost["status"];
  published_at: string | null;
  updated_at: string;
};

const mapPost = (row: PostRow, categoryIds: string[] = []): TloraCmsPost => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  body: row.draft_content?.body || "",
  coverImageUrl: row.cover_image_url,
  keywords: row.keywords || [],
  categoryIds,
  status: row.status,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
});

export async function listTloraPosts(studioId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tlora_cms_posts")
    .select("id,slug,title,excerpt,draft_content,cover_image_url,keywords,status,published_at,updated_at")
    .eq("studio_id", studioId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const postIds = (data || []).map((row) => row.id as string);
  const { data: links, error: linksError } = postIds.length
    ? await admin.from("tlora_cms_post_category_links").select("post_id,category_id").in("post_id", postIds)
    : { data: [], error: null };
  if (linksError) throw linksError;
  return (data || []).map((row) => mapPost(row as PostRow, (links || []).filter((link) => link.post_id === row.id).map((link) => link.category_id as string)));
}

export async function listPublishedTloraPosts(studioId: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_posts")
    .select("id,slug,title,excerpt,published_content,cover_image_url,keywords,status,published_at,updated_at")
    .eq("studio_id", studioId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: row.excerpt as string | null,
    body: ((row.published_content || {}) as { body?: string }).body || "",
    coverImageUrl: row.cover_image_url as string | null,
    keywords: (row.keywords || []) as string[],
    publishedAt: row.published_at as string | null,
  }));
}

export async function getPublishedTloraPost(studioId: string, slug: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_posts")
    .select("id,slug,title,excerpt,published_content,cover_image_url,keywords,published_at")
    .eq("studio_id", studioId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    slug: data.slug as string,
    title: data.title as string,
    excerpt: data.excerpt as string | null,
    body: ((data.published_content || {}) as { body?: string }).body || "",
    coverImageUrl: data.cover_image_url as string | null,
    keywords: (data.keywords || []) as string[],
    publishedAt: data.published_at as string | null,
  };
}

export async function saveTloraPost(input: {
  studioId: string;
  userId: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  keywords: string[];
  categoryIds: string[];
}) {
  const admin = createAdminClient();
  const values = {
    studio_id: input.studioId,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt || null,
    draft_content: { body: input.body },
    cover_image_url: input.coverImageUrl || null,
    keywords: input.keywords,
    updated_by: input.userId,
  };

  const query = input.id
    ? admin.from("tlora_cms_posts").update(values).eq("id", input.id).eq("studio_id", input.studioId)
    : admin.from("tlora_cms_posts").insert({ ...values, created_by: input.userId });
  const { data, error } = await query
    .select("id,slug,title,excerpt,draft_content,cover_image_url,keywords,status,published_at,updated_at")
    .single();
  if (error) throw error;

  const { error: deleteLinksError } = await admin.from("tlora_cms_post_category_links").delete().eq("post_id", data.id);
  if (deleteLinksError) throw deleteLinksError;
  if (input.categoryIds.length) {
    const { error: linkError } = await admin.from("tlora_cms_post_category_links").insert(input.categoryIds.map((categoryId) => ({ post_id: data.id, category_id: categoryId })));
    if (linkError) throw linkError;
  }

  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: input.studioId,
    actor_user_id: input.userId,
    action: input.id ? "post.draft.updated" : "post.created",
    entity_type: "post",
    entity_id: data.id,
    after_value: data,
  });
  return mapPost(data as PostRow, input.categoryIds);
}

export async function publishTloraPost(studioId: string, userId: string, postId: string, changeNote?: string) {
  const admin = createAdminClient();
  const { data: post, error } = await admin
    .from("tlora_cms_posts")
    .select("*")
    .eq("id", postId)
    .eq("studio_id", studioId)
    .single();
  if (error) throw error;

  const { error: versionError } = await admin.from("tlora_cms_post_versions").insert({
    post_id: postId,
    snapshot: post,
    change_note: changeNote || null,
    created_by: userId,
  });
  if (versionError) throw versionError;

  const { data, error: publishError } = await admin
    .from("tlora_cms_posts")
    .update({
      published_content: post.draft_content,
      status: "published",
      published_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", postId)
    .eq("studio_id", studioId)
    .select("id,slug,title,excerpt,draft_content,cover_image_url,keywords,status,published_at,updated_at")
    .single();
  if (publishError) throw publishError;

  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId,
    actor_user_id: userId,
    action: "post.published",
    entity_type: "post",
    entity_id: postId,
    after_value: { changeNote: changeNote || null },
  });
  const { data: links } = await admin.from("tlora_cms_post_category_links").select("category_id").eq("post_id", postId);
  return mapPost(data as PostRow, (links || []).map((link) => link.category_id as string));
}

export async function archiveTloraPost(studioId: string, userId: string, postId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("tlora_cms_posts")
    .update({ status: "archived", updated_by: userId })
    .eq("id", postId)
    .eq("studio_id", studioId);
  if (error) throw error;
  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId,
    actor_user_id: userId,
    action: "post.archived",
    entity_type: "post",
    entity_id: postId,
  });
}

export async function listTloraCategories(studioId: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_post_categories")
    .select("id,slug,name,description")
    .eq("studio_id", studioId)
    .order("name");
  if (error) throw error;
  return (data || []) as TloraCmsCategory[];
}

export async function saveTloraCategory(input: {
  studioId: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
}) {
  const admin = createAdminClient();
  const values = { studio_id: input.studioId, name: input.name, slug: input.slug, description: input.description || null };
  const query = input.id
    ? admin.from("tlora_cms_post_categories").update(values).eq("id", input.id).eq("studio_id", input.studioId)
    : admin.from("tlora_cms_post_categories").insert(values);
  const { data, error } = await query.select("id,slug,name,description").single();
  if (error) throw error;
  return data as TloraCmsCategory;
}
