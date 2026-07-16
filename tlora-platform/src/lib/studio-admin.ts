import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveRequestContext } from "@/lib/tenancy/request-context";

export type StudioAdminContext = {
  studioId: string;
  studioSlug: string;
  studioName: string;
  userId: string;
  settings: Record<string, unknown>;
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
    .select("id,slug,display_name,status,settings,studio_type")
    .eq("slug", studioSlug)
    .eq("status", "active")
    .maybeSingle();
  if (studioError || !studio || studio.studio_type !== "tenant") return null;

  const { data: membership, error: membershipError } = await admin
    .from("studio_members")
    .select("role")
    .eq("studio_id", studio.id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  if (membershipError || !membership) return null;

  return { studioId: studio.id, studioSlug: studio.slug, studioName: studio.display_name, userId: user.id, settings: (studio.settings || {}) as Record<string, unknown> };
}

export async function checkAuthContext(request: Request) {
  const requestContext = await resolveRequestContext(request);
  if (requestContext.userId && requestContext.studio?.studioType === "tenant" && ["owner", "admin"].includes(requestContext.membershipRole || "")) {
    return {
      isPlatformAdmin: false,
      context: {
        studioId: requestContext.studio.id,
        studioSlug: requestContext.studio.slug,
        studioName: requestContext.studio.displayName,
        userId: requestContext.userId,
        settings: requestContext.studio.settings,
      },
    };
  }
  if (requestContext.userId && requestContext.isPlatformAdmin) return { isPlatformAdmin: true, context: null };

  const { NextResponse } = await import("next/server");
  return {
    isPlatformAdmin: false,
    context: null,
    errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 })
  };
}
