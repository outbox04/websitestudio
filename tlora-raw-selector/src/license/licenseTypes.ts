export type LicenseStatus = "loading" | "valid" | "needs_activation" | "invalid" | "offline_expired";

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
}

export interface LicenseCache {
  licenseKey: string;
  userId: string;
  deviceId: string;
  status: "active";
  checkedAt: string;
  expiresAt?: string | null;
}

export interface LicenseState {
  status: LicenseStatus;
  cache: LicenseCache | null;
  error: string;
}

export interface LicenseVerifyResponse {
  ok: boolean;
  status?: string;
  license?: LicenseCache;
  message?: string;
}
