import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseSectionContent } from "@/schemas/tlora-cms";
import type { TloraCmsPage, TloraCmsSection } from "@/types/scope";

type PageRow = {
  id: string;
  page_key: string;
  slug: string;
  title: string;
  status: TloraCmsPage["status"];
  draft_seo_title: string | null;
  draft_seo_description: string | null;
  draft_og_image_url: string | null;
  published_at: string | null;
};

type SectionRow = {
  id: string;
  page_id: string;
  section_key: string;
  section_type: TloraCmsSection["sectionType"];
  draft_content: Record<string, unknown>;
  published_content: Record<string, unknown>;
  schema_version: number;
  is_enabled: boolean;
  sort_order: number;
};

const mapPage = (row: PageRow): TloraCmsPage => ({
  id: row.id, pageKey: row.page_key, slug: row.slug, title: row.title,
  status: row.status, seoTitle: row.draft_seo_title || "", seoDescription: row.draft_seo_description || "",
  ogImageUrl: row.draft_og_image_url || "", publishedAt: row.published_at,
});

const mapSection = (row: SectionRow): TloraCmsSection => ({
  id: row.id, pageId: row.page_id, sectionKey: row.section_key, sectionType: row.section_type,
  draftContent: row.draft_content, publishedContent: row.published_content,
  schemaVersion: row.schema_version, isEnabled: row.is_enabled, sortOrder: row.sort_order,
});

export async function getTloraCmsPage(studioId: string, pageKey = "home") {
  const admin = createAdminClient();
  const { data: page, error } = await admin
    .from("tlora_cms_pages")
    .select("id,page_key,slug,title,status,draft_seo_title,draft_seo_description,draft_og_image_url,published_at")
    .eq("studio_id", studioId)
    .eq("page_key", pageKey)
    .single();
  if (error) throw error;

  const { data: sections, error: sectionsError } = await admin
    .from("tlora_cms_page_sections")
    .select("id,page_id,section_key,section_type,draft_content,published_content,schema_version,is_enabled,sort_order")
    .eq("page_id", page.id)
    .order("sort_order");
  if (sectionsError) throw sectionsError;
  return { page: mapPage(page as PageRow), sections: (sections || []).map((row) => mapSection(row as SectionRow)) };
}

export async function listTloraCmsPages(studioId: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_pages")
    .select("id,page_key,slug,title,status,draft_seo_title,draft_seo_description,draft_og_image_url,published_at")
    .eq("studio_id", studioId)
    .order("created_at");
  if (error) throw error;
  return (data || []).map((row) => mapPage(row as PageRow));
}

export async function getPublishedTloraPageMeta(pageKey: string) {
  const admin = createAdminClient();
  const { data: studio, error: studioError } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").single();
  if (studioError) throw studioError;
  const { data, error } = await admin
    .from("tlora_cms_pages")
    .select("seo_title,seo_description,og_image_url")
    .eq("studio_id", studio.id)
    .eq("page_key", pageKey)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return {
    title: data?.seo_title || "",
    description: data?.seo_description || "",
    ogImageUrl: data?.og_image_url || "",
  };
}

export async function getPublishedTloraSection(pageKey: string, sectionKey: string) {
  const admin = createAdminClient();
  const { data: studio, error: studioError } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").single();
  if (studioError) throw studioError;
  const { data, error } = await admin
    .from("tlora_cms_page_sections")
    .select("published_content,tlora_cms_pages!inner(studio_id,page_key,status)")
    .eq("section_key", sectionKey)
    .eq("tlora_cms_pages.studio_id", studio.id)
    .eq("tlora_cms_pages.page_key", pageKey)
    .eq("tlora_cms_pages.status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data?.published_content || {}) as Record<string, unknown>;
}

export async function updateTloraPageMeta(input: {
  studioId: string;
  userId: string;
  pageId: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
}) {
  const admin = createAdminClient();
  const { data: before, error: readError } = await admin
    .from("tlora_cms_pages")
    .select("draft_seo_title,draft_seo_description,draft_og_image_url")
    .eq("id", input.pageId)
    .eq("studio_id", input.studioId)
    .single();
  if (readError) throw readError;

  const nextValue = {
    draft_seo_title: input.seoTitle || null,
    draft_seo_description: input.seoDescription || null,
    draft_og_image_url: input.ogImageUrl || null,
    updated_by: input.userId,
  };
  const { error } = await admin
    .from("tlora_cms_pages")
    .update(nextValue)
    .eq("id", input.pageId)
    .eq("studio_id", input.studioId);
  if (error) throw error;

  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: input.studioId,
    actor_user_id: input.userId,
    action: "page.meta.updated",
    entity_type: "page",
    entity_id: input.pageId,
    before_value: before,
    after_value: nextValue,
  });
}

export async function updateTloraSectionDraft(input: {
  studioId: string;
  userId: string;
  sectionId: string;
  sectionType: "hero" | "editorial" | "collection" | "gallery" | "contact";
  content: unknown;
  isEnabled: boolean;
}) {
  const content = parseSectionContent(input.sectionType, input.content);
  const admin = createAdminClient();
  const { data: before, error: readError } = await admin
    .from("tlora_cms_page_sections")
    .select("*,tlora_cms_pages!inner(studio_id)")
    .eq("id", input.sectionId)
    .eq("tlora_cms_pages.studio_id", input.studioId)
    .single();
  if (readError) throw readError;

  const { data, error } = await admin
    .from("tlora_cms_page_sections")
    .update({ draft_content: content, is_enabled: input.isEnabled, updated_by: input.userId })
    .eq("id", input.sectionId)
    .select("id,page_id,section_key,section_type,draft_content,published_content,schema_version,is_enabled,sort_order")
    .single();
  if (error) throw error;

  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: input.studioId, actor_user_id: input.userId, action: "section.draft.updated",
    entity_type: "page_section", entity_id: input.sectionId, before_value: before, after_value: data,
  });
  return mapSection(data as SectionRow);
}

export async function publishTloraPage(studioId: string, userId: string, pageId: string, changeNote?: string) {
  const admin = createAdminClient();
  const { data: page, error: pageError } = await admin
    .from("tlora_cms_pages").select("id").eq("id", pageId).eq("studio_id", studioId).single();
  if (pageError || !page) throw pageError || new Error("Page not found");
  const { error } = await admin.rpc("publish_tlora_cms_page", { target_page_id: pageId, change_note: changeNote || null });
  if (error) throw error;
  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId, actor_user_id: userId, action: "page.published",
    entity_type: "page", entity_id: pageId, after_value: { changeNote: changeNote || null },
  });
}
