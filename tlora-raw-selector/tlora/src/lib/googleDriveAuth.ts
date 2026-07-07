import { invoke } from "@tauri-apps/api/core";
import type { AppSettingsData } from "@/store/useSettingsStore";

const TOKEN_KEY = "tlora_google_drive_token";
const STATE_KEY = "tlora_google_oauth_state";
const CODE_VERIFIER_KEY = "tlora_google_oauth_code_verifier";
const REDIRECT_URI_KEY = "tlora_google_oauth_redirect_uri";
const SCOPE = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata",
].join(" ");
const BUILT_IN_CLIENT_ID = "740616686137-s6mlmr03etl01e95t7ual99at57v457m.apps.googleusercontent.com";
const BUILT_IN_CLIENT_SECRET = "";
const ENV_CLIENT_ID = (import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID ?? "").trim();
const ENV_CLIENT_SECRET = (import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET ?? "").trim();

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface StoredGoogleToken extends GoogleTokenResponse {
  expires_at: number;
}

function googleClientId(settings: AppSettingsData) {
  return ENV_CLIENT_ID || BUILT_IN_CLIENT_ID || settings.google_drive_client_id.trim();
}

function googleClientSecret(settings: AppSettingsData) {
  return ENV_CLIENT_SECRET || BUILT_IN_CLIENT_SECRET || settings.google_drive_client_secret.trim();
}

async function googleDriveRedirectUri() {
  return invoke<string>("get_google_drive_auth_callback_url");
}

export function hasBuiltInGoogleOAuthCredentials() {
  return Boolean(ENV_CLIENT_ID || BUILT_IN_CLIENT_ID);
}

export function hasGoogleOAuthCredentials(settings: AppSettingsData) {
  return Boolean(googleClientId(settings));
}

export function googleRedirectUri() {
  return "http://127.0.0.1:<port>/oauth/google/callback";
}

export function getStoredGoogleToken(): StoredGoogleToken | null {
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredGoogleToken;
  } catch {
    return null;
  }
}

export async function refreshGoogleToken(settings: AppSettingsData, refreshToken: string) {
  const clientId = googleClientId(settings);
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const clientSecret = googleClientSecret(settings);
  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error_description || data.error || `Google OAuth HTTP ${resp.status}`);
  }

  return saveToken({
    ...(data as GoogleTokenResponse),
    refresh_token: refreshToken,
  });
}

export async function getValidGoogleToken(settings: AppSettingsData) {
  const token = getStoredGoogleToken();
  if (!token) {
    throw new Error("Chua dang nhap Google Drive.");
  }

  if (token.expires_at > Date.now() + 60_000) {
    return token;
  }

  if (!token.refresh_token) {
    throw new Error("Google token da het han. Hay dang nhap Google Drive lai.");
  }

  return refreshGoogleToken(settings, token.refresh_token);
}

export function clearStoredGoogleToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function saveToken(token: GoogleTokenResponse) {
  const stored: StoredGoogleToken = {
    ...token,
    expires_at: Date.now() + token.expires_in * 1000,
  };
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
  return stored;
}

export async function buildGoogleAuthUrl(settings: AppSettingsData) {
  const clientId = googleClientId(settings);
  if (!clientId) {
    throw new Error("Google Drive OAuth chua duoc cau hinh cho ban build nay.");
  }

  const redirectUri = await googleDriveRedirectUri();
  const state = crypto.randomUUID();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  window.sessionStorage.setItem(STATE_KEY, state);
  window.sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  window.sessionStorage.setItem(REDIRECT_URI_KEY, redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(settings: AppSettingsData, code: string, state: string | null) {
  const expectedState = window.sessionStorage.getItem(STATE_KEY);
  if (expectedState && state !== expectedState) {
    throw new Error("Google OAuth state khong khop.");
  }

  const clientId = googleClientId(settings);
  const codeVerifier = window.sessionStorage.getItem(CODE_VERIFIER_KEY);
  const redirectUri = window.sessionStorage.getItem(REDIRECT_URI_KEY);
  if (!clientId || !codeVerifier || !redirectUri) {
    throw new Error("Google Drive OAuth chua co du thong tin PKCE de xac thuc.");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const clientSecret = googleClientSecret(settings);
  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error_description || data.error || `Google OAuth HTTP ${resp.status}`);
  }

  window.sessionStorage.removeItem(CODE_VERIFIER_KEY);
  window.sessionStorage.removeItem(REDIRECT_URI_KEY);
  return saveToken(data as GoogleTokenResponse);
}

export async function checkDriveFolderWithToken(folderId: string, accessToken: string) {
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const message = data?.error?.message || `Google Drive API HTTP ${resp.status}`;
    throw new Error(message);
  }
  return data as { id: string; name: string; mimeType: string };
}

export async function ensureTloraDriveFolder(settings: AppSettingsData, folderName = "TLORA") {
  const token = await getValidGoogleToken(settings);
  const query = [
    "'root' in parents",
    `name='${driveQueryEscape(folderName)}'`,
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false",
  ].join(" and ");
  const listParams = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType)",
    spaces: "drive",
    pageSize: "1",
  });
  const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?${listParams.toString()}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const listData = await listResp.json().catch(() => null);
  if (!listResp.ok) {
    const message = listData?.error?.message || `Google Drive API HTTP ${listResp.status}`;
    throw new Error(message);
  }

  const existing = listData?.files?.[0];
  if (existing?.id) {
    return existing as { id: string; name: string; mimeType: string };
  }

  const createResp = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: ["root"],
    }),
  });
  const createData = await createResp.json().catch(() => null);
  if (!createResp.ok) {
    const message = createData?.error?.message || `Google Drive API HTTP ${createResp.status}`;
    throw new Error(message);
  }
  return createData as { id: string; name: string; mimeType: string };
}

function driveQueryEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function createCodeVerifier() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createCodeChallenge(codeVerifier: string) {
  const bytes = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
