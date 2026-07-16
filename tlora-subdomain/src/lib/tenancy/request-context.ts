import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudioRole = "owner" | "admin" | "staff";
export type StudioContext = {
  id: string;
  slug: string;
  displayName: string;
  studioType: "first_party" | "tenant";
  systemKey: string | null;
  settings: Record<string, unknown>;
};

export function normalizedHostname(host: string | null) {
  return (host || "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";
}

export function studioSlugFromRequestHost(host: string | null) {
  const hostname = normalizedHostname(host);
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  if (hostname.endsWith(".localhost") && hostname !== "localhost") return hostname.slice(0, -".localhost".length);
  if (!hostname.endsWith(`.${rootDomain}`) || hostname === `www.${rootDomain}`) return null;
  const slug = hostname.slice(0, -`.${rootDomain}`.length);
  return slug && !slug.includes(".") ? slug : null;
}

export async function resolveStudioBySlug(slug: string): Promise<StudioContext | null> {
  const { data, error } = await createAdminClient()
    .from("studios")
    .select("id,slug,display_name,studio_type,system_key,status,settings")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    studioType: data.studio_type,
    systemKey: data.system_key,
    settings: (data.settings || {}) as Record<string, unknown>,
  };
}

export async function resolveStudioRequest(request: Request) {
  const slug = studioSlugFromRequestHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  const studio = slug ? await resolveStudioBySlug(slug) : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !studio) return { studio, userId: user?.id || null, role: null as StudioRole | null, isPlatformAdmin: false };
  const admin = createAdminClient();
  const [{ data: membership }, { data: profile }] = await Promise.all([
    admin.from("studio_members").select("role,is_active").eq("studio_id", studio.id).eq("user_id", user.id).maybeSingle(),
    admin.from("profiles").select("is_active,is_platform_admin").eq("id", user.id).maybeSingle(),
  ]);
  return {
    studio,
    userId: user.id,
    role: membership?.is_active ? membership.role as StudioRole : null,
    isPlatformAdmin: Boolean(profile?.is_active && profile.is_platform_admin),
  };
}

