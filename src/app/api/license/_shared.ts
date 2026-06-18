import { createAdminClient } from "@/lib/supabase/admin";

export function licenseJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export function licenseOptions() {
  return licenseJson({ ok: true });
}

export async function authenticatedUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return { error: licenseJson({ ok: false, message: "Missing authorization token" }, 401), user: null };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: licenseJson({ ok: false, message: "Invalid authorization token" }, 401), user: null };
  }

  return { error: null, user: data.user, supabase };
}

export function normalizeLicenseKey(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function cachePayload(license: {
  license_key: string;
  user_id: string | null;
  status: string;
  expires_at: string | null;
}, deviceId: string) {
  return {
    licenseKey: license.license_key,
    userId: license.user_id || "",
    deviceId,
    status: "active",
    checkedAt: new Date().toISOString(),
    expiresAt: license.expires_at,
  };
}
