import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateTloraPublicShell } from "@/lib/tlora-public-cache";

export type TloraSiteSettings = {
  siteName: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  facebookUrl: string;
  zalo: string;
  defaultOgImage: string;
  googleMapsEmbed: string;
};

const defaults: TloraSiteSettings = {
  siteName: "TLORA Studio",
  description: "",
  phone: "",
  email: "",
  address: "",
  facebookUrl: "",
  zalo: "",
  defaultOgImage: "",
  googleMapsEmbed: "",
};

export async function getTloraSiteSettings(studioId: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_settings")
    .select("id,draft_value,published_value")
    .eq("studio_id", studioId)
    .eq("setting_key", "site")
    .maybeSingle();
  if (error) throw error;
  return {
    id: data?.id as string | undefined,
    draft: { ...defaults, ...((data?.draft_value || {}) as Partial<TloraSiteSettings>) },
    published: { ...defaults, ...((data?.published_value || {}) as Partial<TloraSiteSettings>) },
  };
}

export async function getPublishedTloraSiteSettings(studioId: string) {
  const { data, error } = await createAdminClient()
    .from("tlora_cms_settings")
    .select("published_value")
    .eq("studio_id", studioId)
    .eq("setting_key", "site")
    .maybeSingle();
  if (error) throw error;
  return { ...defaults, ...((data?.published_value || {}) as Partial<TloraSiteSettings>) };
}

export async function saveTloraSiteSettings(studioId: string, userId: string, value: TloraSiteSettings) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tlora_cms_settings").upsert({
    studio_id: studioId,
    setting_key: "site",
    draft_value: value,
    updated_by: userId,
  }, { onConflict: "studio_id,setting_key" }).select("id,draft_value,published_value").single();
  if (error) throw error;
  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId, actor_user_id: userId, action: "settings.draft.updated",
    entity_type: "settings", entity_id: data.id, after_value: value,
  });
  return { id: data.id as string, draft: data.draft_value as TloraSiteSettings, published: { ...defaults, ...((data.published_value || {}) as Partial<TloraSiteSettings>) } };
}

export async function publishTloraSiteSettings(studioId: string, userId: string) {
  const admin = createAdminClient();
  const { data: current, error } = await admin.from("tlora_cms_settings").select("id,draft_value").eq("studio_id", studioId).eq("setting_key", "site").single();
  if (error) throw error;
  const { data, error: updateError } = await admin.from("tlora_cms_settings").update({ published_value: current.draft_value, updated_by: userId }).eq("id", current.id).select("id,draft_value,published_value").single();
  if (updateError) throw updateError;
  await admin.from("tlora_cms_activity_logs").insert({
    studio_id: studioId, actor_user_id: userId, action: "settings.published",
    entity_type: "settings", entity_id: current.id, after_value: current.draft_value,
  });
  invalidateTloraPublicShell();
  return { id: data.id as string, draft: data.draft_value as TloraSiteSettings, published: data.published_value as TloraSiteSettings };
}
