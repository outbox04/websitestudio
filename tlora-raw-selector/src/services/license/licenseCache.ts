import { invoke } from "@tauri-apps/api/core";
import type { LicenseCache } from "@/license/licenseTypes";

export async function readLicenseCache() {
  return invoke<LicenseCache | null>("read_license_cache");
}

export async function writeLicenseCache(cache: LicenseCache) {
  await invoke("write_license_cache", { cache });
}

export async function clearLicenseCache() {
  await invoke("clear_license_cache");
}
