import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext, getStudioAdminContext } from "@/lib/studio-admin";
import { invalidateTloraPublicShell } from "@/lib/tlora-public-cache";

export async function PUT(request: Request) {
  const body = await request.json() as { settings?: Record<string, unknown>; studioSlug?: string };
  const auth = await checkAuthContext(request);
  const context = auth.context || (body.studioSlug ? await getStudioAdminContext(body.studioSlug) : null);
  if (!context) return auth.errorResponse || NextResponse.json({ error: "Studio context is required" }, { status: 400 });
  if (!body.settings || typeof body.settings !== "object") return NextResponse.json({ error: "Thiếu dữ liệu cài đặt." }, { status: 400 });

  // Whitelist keeps this endpoint from overwriting operational settings by accident.
  const allowed = [
    "logo_url",
    "site_description",
    "og_image_url",
    "primary_color",
    "accent_color",
    "hero_title",
    "hero_description",
    "hero_image_url",
    "phone",
    "email",
    "address",
    "facebook_url",
    "zalo_phone",
    "site_content",
    "seo_keywords",
    "canonical_url",
    "facebook_pixel_id",
    "google_analytics_id",
    "google_ads_id",
    "google_tag_manager_id",
    "tiktok_pixel_id",
    "custom_head_code",
    "custom_body_code",
    "defer_non_critical",
  ];
  const next = Object.fromEntries(Object.entries(body.settings).filter(([key]) => allowed.includes(key)));
  const settings = {
    ...(context.settings || {}),
    ...next,
  };
  const { data, error } = await createAdminClient().from("studios").update({ settings }).eq("id", context.studioId).select("settings").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateTloraPublicShell();
  return NextResponse.json({ settings: data.settings });
}
