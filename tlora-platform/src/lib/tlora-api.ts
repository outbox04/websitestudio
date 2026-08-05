import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTloraStudioId } from "@/lib/tlora-studio";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers || {}),
    },
  });
}

export function options() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

export function isAuthorized(request: Request) {
  const expected = process.env.TLORA_API_KEY;
  if (!expected) {
    return false;
  }

  const apiKey = request.headers.get("x-api-key");
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const provided = apiKey || bearer;
  if (!provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export type TloraApiAuthContext = {
  studioId: string;
  userId: string | null;
  mode: "session" | "api-key";
};

function bearerToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

export async function authenticateTloraRequest(request: Request): Promise<TloraApiAuthContext | null> {
  if (isAuthorized(request)) {
    return {
      studioId: await requireTloraStudioId(),
      userId: null,
      mode: "api-key",
    };
  }

  const token = bearerToken(request);
  if (!token) return null;

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return null;

  const [{ data: profile }, { data: memberships, error: membershipError }] = await Promise.all([
    admin.from("profiles").select("default_studio_id").eq("id", user.id).maybeSingle(),
    admin
      .from("studio_members")
      .select("studio_id,role,is_active,created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (membershipError) throw membershipError;
  const activeMemberships = memberships || [];
  const preferred = activeMemberships.find(
    (membership) => membership.studio_id === profile?.default_studio_id,
  );
  const membership = preferred || activeMemberships[0];

  if (membership?.studio_id) {
    return { studioId: membership.studio_id, userId: user.id, mode: "session" };
  }

  const { data: licensedStudio, error: licenseError } = await admin
    .from("licenses")
    .select("studio_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("studio_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (licenseError) throw licenseError;

  if (licensedStudio?.studio_id) {
    return { studioId: licensedStudio.studio_id, userId: user.id, mode: "session" };
  }

  const { data: ownedStudio, error: ownerError } = await admin
    .from("studios")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownerError) throw ownerError;

  return ownedStudio?.id
    ? { studioId: ownedStudio.id, userId: user.id, mode: "session" }
    : null;
}

export function publicOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host) {
    return new URL(request.url).origin;
  }
  const protocol = forwardedProto || (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return [record.message, record.details, record.hint, record.code].filter(Boolean).join(" - ") || JSON.stringify(record);
  }

  return "Unknown error";
}
