import { publicOriginFromHeaders } from "@/lib/public-origin";
import { createSlug } from "@/lib/slug";

export const WEDDING_FEATURE_SLUG = "wedding";

export const weddingInvitationSelect = [
  "id",
  "studio_id",
  "slug",
  "status",
  "groom_name",
  "bride_name",
  "event_date",
  "event_time",
  "venue_name",
  "venue_address",
  "cover_image_url",
  "theme",
  "config",
  "published_at",
  "created_by",
  "created_at",
  "updated_at",
].join(",");

export type WeddingInvitationPayload = {
  studioSlug?: string;
  slug?: string;
  status?: string;
  groomName?: string;
  brideName?: string;
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  venueAddress?: string;
  coverImageUrl?: string;
  theme?: string;
  config?: Record<string, unknown>;
};

export type SupabaseAdmin = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

type StudioRow = {
  id: string;
  slug: string;
  display_name: string;
};

function cleanString(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanDate(value: unknown) {
  const text = cleanString(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cleanTime(value: unknown) {
  const text = cleanString(value, 20);
  return /^\d{2}:\d{2}(:\d{2})?$/.test(text) ? text : null;
}

export function getRequestStudioSlug(request: Request) {
  const url = new URL(request.url);
  const querySlug = cleanString(url.searchParams.get("studioSlug"), 80);
  if (querySlug) return querySlug;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const hostname = host.split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  const suffix = `.${rootDomain}`;
  if (!hostname.endsWith(suffix) || hostname.startsWith(`www.${rootDomain}`)) return "";

  const slug = hostname.slice(0, -suffix.length);
  return slug && !slug.includes(".") ? slug : "";
}

export function getErrorMessage(error: unknown, fallback = "Khong xu ly duoc yeu cau") {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const message = [record.message, record.details, record.hint, record.code].filter(Boolean).join(" - ");
    return message || JSON.stringify(record);
  }
  return fallback;
}

export function invitationPublicUrl(request: Request, studioSlug: string | null, invitationSlug: string) {
  const requestedOrigin = publicOriginFromHeaders(request.headers) || new URL(request.url).origin;
  const rootDomain = process.env.ROOT_DOMAIN || "tlgroup.site";
  let origin = requestedOrigin;

  if (studioSlug && !requestedOrigin.includes("localhost") && !requestedOrigin.includes("127.0.0.1")) {
    origin = `https://${studioSlug}.${rootDomain}`;
  }

  return `${origin.replace(/\/$/, "")}/thiep/${invitationSlug}`;
}

export async function resolveStudio(admin: SupabaseAdmin, studioSlug: string): Promise<StudioRow> {
  let query = admin
    .from("studios")
    .select("id,slug,display_name")
    .eq("status", "active");
  query = !studioSlug || studioSlug === WEDDING_FEATURE_SLUG
    ? query.eq("studio_type", "first_party").eq("system_key", "tlora")
    : query.eq("slug", studioSlug).eq("studio_type", "tenant");
  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Studio khong ton tai hoac chua kich hoat.");
  return data as StudioRow;
}

export function invitationInsertFromPayload(payload: WeddingInvitationPayload, studioId: string, createdBy?: string) {
  const status = payload.status === "published" ? "published" : payload.status === "archived" ? "archived" : "draft";
  const groomName = cleanString(payload.groomName, 160);
  const brideName = cleanString(payload.brideName, 160);
  const venueName = cleanString(payload.venueName, 240);
  const venueAddress = cleanString(payload.venueAddress, 500);
  const theme = cleanString(payload.theme, 40) || "rose";
  const config = payload.config && typeof payload.config === "object" ? payload.config : {};

  return {
    studio_id: studioId,
    status,
    groom_name: groomName,
    bride_name: brideName,
    event_date: cleanDate(payload.eventDate),
    event_time: cleanTime(payload.eventTime),
    venue_name: venueName,
    venue_address: venueAddress,
    cover_image_url: cleanString(payload.coverImageUrl, 1200) || null,
    theme,
    config,
    published_at: status === "published" ? new Date().toISOString() : null,
    created_by: createdBy || null,
  };
}

export function invitationUpdateFromPayload(payload: WeddingInvitationPayload) {
  const update: Record<string, unknown> = {};

  if (payload.status !== undefined) {
    const status = payload.status === "published" ? "published" : payload.status === "archived" ? "archived" : "draft";
    update.status = status;
    update.published_at = status === "published" ? new Date().toISOString() : null;
  }
  if (payload.groomName !== undefined) update.groom_name = cleanString(payload.groomName, 160);
  if (payload.brideName !== undefined) update.bride_name = cleanString(payload.brideName, 160);
  if (payload.eventDate !== undefined) update.event_date = cleanDate(payload.eventDate);
  if (payload.eventTime !== undefined) update.event_time = cleanTime(payload.eventTime);
  if (payload.venueName !== undefined) update.venue_name = cleanString(payload.venueName, 240);
  if (payload.venueAddress !== undefined) update.venue_address = cleanString(payload.venueAddress, 500);
  if (payload.coverImageUrl !== undefined) update.cover_image_url = cleanString(payload.coverImageUrl, 1200) || null;
  if (payload.theme !== undefined) update.theme = cleanString(payload.theme, 40) || "rose";
  if (payload.config !== undefined) update.config = payload.config && typeof payload.config === "object" ? payload.config : {};

  return update;
}

export async function createUniqueInvitationSlug(admin: SupabaseAdmin, studioId: string, payload: WeddingInvitationPayload) {
  const requestedSlug = createSlug(payload.slug || "");
  const base =
    requestedSlug ||
    createSlug([payload.groomName, payload.brideName, payload.eventDate].filter(Boolean).join(" ")) ||
    "thiep-cuoi";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    let query = admin.from("wedding_invitations").select("id").eq("slug", slug);
    query = query.eq("studio_id", studioId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return slug;
  }

  return `${base}-${Date.now()}`;
}
