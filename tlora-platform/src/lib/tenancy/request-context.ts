import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PlatformStudio, RequestContext, StudioRole } from "@/types/scope";

type StudioRow = {
  id: string;
  slug: string;
  display_name: string;
  studio_type: "first_party" | "tenant";
  system_key: string | null;
  status: PlatformStudio["status"];
  settings: Record<string, unknown> | null;
};

export class AuthorizationError extends Error {
  constructor(message: string, readonly status: 401 | 403 | 404 = 403) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function normalizedHostname(host: string | null) {
  return (host || "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";
}

export function isTloraStudio(studio: Pick<StudioRow, "studio_type" | "system_key"> | null | undefined) {
  return studio?.studio_type === "first_party" && studio.system_key === "tlora";
}

function toPlatformStudio(row: StudioRow): PlatformStudio {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    studioType: row.studio_type,
    systemKey: row.system_key,
    status: row.status,
    settings: row.settings || {},
  };
}

export async function getFirstPartyStudio(systemKey = "tlora") {
  const { data, error } = await createAdminClient()
    .from("studios")
    .select("id,slug,display_name,studio_type,system_key,status,settings")
    .eq("studio_type", "first_party")
    .eq("system_key", systemKey)
    .maybeSingle();
  if (error) throw error;
  return data ? toPlatformStudio(data as StudioRow) : null;
}

export async function resolveStudioFromHost(host: string | null) {
  const hostname = normalizedHostname(host);
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  let slug: string | null = null;

  if (hostname.endsWith(".localhost") && hostname !== "localhost") {
    slug = hostname.slice(0, -".localhost".length);
  } else if (hostname.endsWith(`.${rootDomain}`) && hostname !== `www.${rootDomain}`) {
    slug = hostname.slice(0, -`.${rootDomain}`.length);
  }

  const query = createAdminClient()
    .from("studios")
    .select("id,slug,display_name,studio_type,system_key,status,settings")
    .eq("status", "active");
  const { data, error } = slug
    ? await query.eq("slug", slug).maybeSingle()
    : await query.eq("primary_domain", hostname).maybeSingle();
  if (error) throw error;
  return data ? toPlatformStudio(data as StudioRow) : null;
}

export async function resolveRequestContext(request?: Request): Promise<RequestContext> {
  const requestHeaders = request?.headers || await headers();
  const hostname = normalizedHostname(requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"));
  const studio = await resolveStudioFromHost(hostname);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { scope: studio && isTloraStudio({ studio_type: studio.studioType, system_key: studio.systemKey }) ? "tlora" : studio ? "studio" : "platform", studio, userId: null, membershipRole: null, isPlatformAdmin: false, hostname };
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: membership }] = await Promise.all([
    admin.from("profiles").select("is_active,is_platform_admin").eq("id", user.id).maybeSingle(),
    studio
      ? admin.from("studio_members").select("role,is_active").eq("studio_id", studio.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const scope = studio ? (studio.studioType === "first_party" && studio.systemKey === "tlora" ? "tlora" : "studio") : "platform";
  return {
    scope,
    studio,
    userId: user.id,
    membershipRole: membership?.is_active ? membership.role as StudioRole : null,
    isPlatformAdmin: Boolean(profile?.is_active && profile.is_platform_admin),
    hostname,
  };
}

export async function requirePlatformAdmin(request?: Request) {
  const context = await resolveRequestContext(request);
  if (!context.userId) throw new AuthorizationError("Unauthorized", 401);
  if (!context.isPlatformAdmin) throw new AuthorizationError("Platform administrator required");
  return context;
}

export async function requireTloraAdmin(request?: Request) {
  const context = await resolveRequestContext(request);
  if (!context.userId) throw new AuthorizationError("Unauthorized", 401);
  const tlora = context.studio && context.studio.studioType === "first_party" && context.studio.systemKey === "tlora"
    ? context.studio
    : await getFirstPartyStudio();
  if (!tlora) throw new AuthorizationError("TLORA first-party studio is not configured", 404);
  if (context.isPlatformAdmin) return { ...context, scope: "tlora" as const, studio: tlora };

  const { data: membership } = await createAdminClient()
    .from("studio_members")
    .select("role,is_active")
    .eq("studio_id", tlora.id)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!membership?.is_active || !["owner", "admin"].includes(membership.role)) {
    throw new AuthorizationError("TLORA administrator required");
  }
  return { ...context, scope: "tlora" as const, studio: tlora, membershipRole: membership.role as StudioRole };
}

export async function requireStudioRole(roles: StudioRole[], request?: Request) {
  const context = await resolveRequestContext(request);
  if (!context.userId) throw new AuthorizationError("Unauthorized", 401);
  if (!context.studio || context.studio.studioType !== "tenant") throw new AuthorizationError("Tenant studio required");
  if (!context.membershipRole || !roles.includes(context.membershipRole)) throw new AuthorizationError("Insufficient studio role");
  return context;
}

export const requireStudioMember = (request?: Request) => requireStudioRole(["owner", "admin", "staff"], request);

