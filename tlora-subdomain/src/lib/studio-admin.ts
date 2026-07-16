import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveStudioRequest, studioSlugFromRequestHost } from "@/lib/tenancy/request-context";

export type StudioAdminContext = {
  studioId: string;
  studioSlug: string;
  studioName: string;
  userId: string;
  settings: Record<string, unknown>;
};

export function studioSlugFromHost(host: string | null) {
  return studioSlugFromRequestHost(host);
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
  const resolved = await resolveStudioRequest(request);
  if (resolved.studio?.studioType === "tenant" && resolved.userId && ["owner", "admin"].includes(resolved.role || "")) {
    return {
      isPlatformAdmin: false,
      context: {
        studioId: resolved.studio.id,
        studioSlug: resolved.studio.slug,
        studioName: resolved.studio.displayName,
        userId: resolved.userId,
        settings: resolved.studio.settings,
      },
    };
  }
  if (resolved.userId && resolved.isPlatformAdmin) return { isPlatformAdmin: true, context: null };

  const { NextResponse } = await import("next/server");
  return {
    isPlatformAdmin: false,
    context: null,
    errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 })
  };
}
