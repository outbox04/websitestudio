import type { AppSettingsData } from "@/store/useSettingsStore";

const DEFAULT_API_URL = import.meta.env.VITE_TLORA_LICENSE_API_URL || "";

export interface WebsiteAlbumPayload {
  albumName: string;
  customerName: string;
  albumPath: string;
  rawDir: string;
  jpgDir: string;
  editRequestDir: string;
  editedDir: string;
  driveFileGocUrl: string;
  driveFileChinhSuaUrl: string;
  websiteUrl: string;
  createdAt?: string;
}

export interface WebsiteEditRequestPayload {
  albumName: string;
  customerName: string;
  requested: number;
  matched: number;
  missing: number;
  outputDir: string;
  doneFile: string;
  copiedFiles: string[];
  missingFiles: string[];
}

export interface WebsiteEditedUploadPayload {
  albumName: string;
  customerName: string;
  uploaded: number;
  skipped: number;
  destinationDir: string;
}

export interface WebsiteDriveFilePayload {
  albumName: string;
  kind: "raw" | "edited";
  files: Array<{
    driveFileId: string;
    fileName: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
  }>;
}

export interface WebsiteAlbumListItem {
  id: string;
  albumName: string;
  customerName: string;
  slug: string;
  shootDate?: string | null;
  driveFileGocUrl?: string | null;
  driveFileChinhSuaUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function baseUrl(settings: AppSettingsData) {
  const value = (settings.api_url.trim() || DEFAULT_API_URL).replace(/\/+$/, "");
  if (!value) return "";

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Website API URL không hợp lệ. URL phải bắt đầu bằng https://");
  }

  if (url.hostname === "vercel.com") {
    throw new Error("Đây là URL dashboard Vercel. Hãy dùng domain deploy của website, ví dụ https://websitestudio.vercel.app");
  }

  return value;
}

function headers(settings: AppSettingsData) {
  const apiKey = settings.api_key.trim();
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey } : {}),
  };
}

async function request<T>(
  settings: AppSettingsData,
  path: string,
  init?: RequestInit,
  options?: { auth?: boolean }
): Promise<T> {
  const base = baseUrl(settings);
  if (!base) {
    throw new Error("Chưa cấu hình Website API URL.");
  }

  const auth = options?.auth ?? true;
  const resp = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(auth ? headers(settings) : { Accept: "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const text = await resp.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(`Website chưa có endpoint ${path}. Cần thêm API route này vào project Vercel.`);
    }

    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : text || `HTTP ${resp.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function testWebsiteApi(settings: AppSettingsData) {
  return request<{ ok?: boolean; status?: string }>(settings, "/api/tlora/health", undefined, { auth: false });
}

export async function syncAlbumToWebsite(settings: AppSettingsData, payload: WebsiteAlbumPayload) {
  return request<{ ok?: boolean; websiteUrl?: string; driveFileGocUrl?: string; driveFileChinhSuaUrl?: string }>(settings, "/api/tlora/albums", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchWebsiteAlbums(settings: AppSettingsData) {
  return request<{ ok?: boolean; albums?: WebsiteAlbumListItem[] }>(settings, "/api/tlora/albums");
}

export async function fetchWebsiteEditRequest(settings: AppSettingsData, albumName: string) {
  const query = new URLSearchParams({ albumName }).toString();
  return request<{ files?: string[]; selectedFiles?: string[]; selected_files?: string[] }>(
    settings,
    `/api/tlora/edit-requests?${query}`
  );
}

export async function syncEditRequestToWebsite(settings: AppSettingsData, payload: WebsiteEditRequestPayload) {
  return request<{ ok?: boolean }>(settings, "/api/tlora/edit-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function syncEditedUploadToWebsite(settings: AppSettingsData, payload: WebsiteEditedUploadPayload) {
  return request<{ ok?: boolean }>(settings, "/api/tlora/edited-uploads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function syncDriveFilesToWebsite(settings: AppSettingsData, payload: WebsiteDriveFilePayload) {
  return request<{ ok?: boolean; synced?: number; kind?: "raw" | "edited" }>(settings, "/api/tlora/photos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resyncGalleryDriveFiles(settings: AppSettingsData, albumName: string) {
  const slug = albumName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Không tạo được slug album để đồng bộ Drive.");
  }

  return request<{ rawCount?: number; editedCount?: number }>(
    settings,
    `/api/customer-galleries/${encodeURIComponent(slug)}/sync`,
    { method: "POST" },
    { auth: false },
  );
}
