import type { Session } from "@supabase/supabase-js";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettingsData } from "@/store/useSettingsStore";
import type { DeviceInfo, LicenseCache, LicenseVerifyResponse } from "@/license/licenseTypes";
import { readLicenseCache, writeLicenseCache } from "@/services/license/licenseCache";

const OFFLINE_DAYS = 7;

function configuredApiUrl(settings: AppSettingsData) {
  const envUrl = import.meta.env.VITE_TLORA_LICENSE_API_URL || import.meta.env.VITE_TLORA_API_URL || "";
  const value = (envUrl || settings.api_url || "").trim().replace(/\/+$/, "");
  if (!value) throw new Error("Chưa cấu hình License API URL.");
  return value;
}

async function loadSettings() {
  return invoke<AppSettingsData>("load_settings");
}

async function licenseRequest<T>(settings: AppSettingsData, session: Session, path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${configuredApiUrl(settings)}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const message = data?.message || data?.error || `License API HTTP ${resp.status}`;
    throw new Error(message);
  }
  return data as T;
}

export function isOfflineCacheValid(cache: LicenseCache | null, session: Session, deviceId: string) {
  if (!cache || cache.userId !== session.user.id || cache.deviceId !== deviceId || cache.status !== "active") {
    return false;
  }
  const checkedAt = new Date(cache.checkedAt).getTime();
  if (!Number.isFinite(checkedAt)) return false;
  return Date.now() - checkedAt <= OFFLINE_DAYS * 24 * 60 * 60 * 1000;
}

export async function verifyLicense(session: Session, device: DeviceInfo) {
  const cache = await readLicenseCache();
  const settings = await loadSettings();

  try {
    const result = await licenseRequest<LicenseVerifyResponse>(settings, session, "/api/license/verify", {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
    });
    if (!result.ok || !result.license) {
      return { valid: false, cache: null, offline: false, message: result.message || "License không hợp lệ." };
    }
    await writeLicenseCache(result.license);
    return { valid: true, cache: result.license, offline: false, message: "" };
  } catch (e) {
    if (isOfflineCacheValid(cache, session, device.deviceId)) {
      return { valid: true, cache, offline: true, message: "Đang dùng license offline." };
    }
    return { valid: false, cache, offline: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function activateLicense(session: Session, device: DeviceInfo, licenseKey: string) {
  const settings = await loadSettings();
  const result = await licenseRequest<LicenseVerifyResponse>(settings, session, "/api/license/activate", {
    licenseKey,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
  });
  if (!result.ok || !result.license) {
    throw new Error(result.message || "Không kích hoạt được license.");
  }
  await writeLicenseCache(result.license);
  return result.license;
}
