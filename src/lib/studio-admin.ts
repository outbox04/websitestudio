import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudioAdminContext = {
  studioId: string;
  studioSlug: string;
  studioName: string;
  userId: string;
  settings?: any;
};

export function studioSlugFromHost(host: string | null) {
  const hostname = (host || "").split(",")[0].trim().split(":")[0].toLowerCase();
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  const suffix = `.${rootDomain}`;

  if (!hostname.endsWith(suffix) || hostname.startsWith(`www.${rootDomain}`)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return slug && !slug.includes(".") ? slug : null;
}

export async function getStudioAdminContext(studioSlug: string): Promise<StudioAdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: studio, error: studioError } = await admin
    .from("studios")
    .select("id,slug,display_name,status,settings")
    .eq("slug", studioSlug)
    .eq("status", "active")
    .maybeSingle();
  if (studioError || !studio) return null;

  const { data: membership, error: membershipError } = await admin
    .from("studio_members")
    .select("role")
    .eq("studio_id", studio.id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  if (membershipError || !membership) return null;

  return { studioId: studio.id, studioSlug: studio.slug, studioName: studio.display_name, userId: user.id, settings: studio.settings };
}

export async function checkAuthContext(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const studioSlug = studioSlugFromHost(host);
  const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
  
  if (context) {
    return { isPlatformAdmin: false, context };
  }
  
  const supabaseClient = await createClient();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_active,is_platform_admin")
      .eq("id", user.id)
      .maybeSingle();
    
    if (profile?.is_active && profile.is_platform_admin) {
      return { isPlatformAdmin: true, context: null };
    }
  }
  
  const { NextResponse } = await import("next/server");
  return {
    isPlatformAdmin: false,
    context: null,
    errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 })
  };
}
