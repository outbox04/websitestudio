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

export type LicenseRecord = {
  id?: string;
  license_key: string;
  user_id: string | null;
  status: string;
  plan?: string | null;
  duration_days?: number | null;
  activated_at?: string | null;
  expires_at: string | null;
  last_renewed_at?: string | null;
  renewal_count?: number | null;
};

const planDurations: Record<string, number> = {
  basic: 30,
  medium: 90,
  premium: 365,
  standard: 30,
};

export function durationDaysForLicense(license: Pick<LicenseRecord, "plan" | "duration_days">) {
  const explicitDays = Number(license.duration_days || 0);
  if (Number.isFinite(explicitDays) && explicitDays > 0) {
    return Math.floor(explicitDays);
  }

  return planDurations[String(license.plan || "").toLowerCase()] || planDurations.standard;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isLicenseExpired(license: Pick<LicenseRecord, "expires_at">, now = new Date()) {
  return Boolean(license.expires_at && new Date(license.expires_at).getTime() <= now.getTime());
}

export function expiredLicensePayload(license: Pick<LicenseRecord, "license_key" | "expires_at">) {
  return {
    ok: false,
    code: "LICENSE_EXPIRED",
    locked: true,
    localDataRetained: true,
    renewalRequired: true,
    licenseKey: license.license_key,
    expiresAt: license.expires_at,
    message: "License đã hết hạn. Dữ liệu vẫn được giữ trên máy và sẽ mở lại sau khi gia hạn.",
  };
}

export function renewedExpiry(license: Pick<LicenseRecord, "expires_at">, durationDays: number, now = new Date()) {
  const currentExpiry = license.expires_at ? new Date(license.expires_at) : null;
  const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  return addDays(base, durationDays);
}

export function cachePayload(license: {
  license_key: string;
  user_id: string | null;
  status: string;
  activated_at?: string | null;
  expires_at: string | null;
}, deviceId: string) {
  return {
    licenseKey: license.license_key,
    userId: license.user_id || "",
    deviceId,
    status: license.status,
    checkedAt: new Date().toISOString(),
    activatedAt: license.activated_at || null,
    expiresAt: license.expires_at,
  };
}
