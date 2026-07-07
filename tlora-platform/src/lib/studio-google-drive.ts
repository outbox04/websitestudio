import "server-only";

import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

type OAuthState = { studioId: string; studioSlug: string; studioName: string; userId: string; expiresAt: number };
type DriveConnection = { root_folder_id: string; refresh_token_ciphertext: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function encryptionKey() {
  const key = Buffer.from(required("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}

export function oauthClient() {
  return new google.auth.OAuth2(required("GOOGLE_OAUTH_CLIENT_ID"), required("GOOGLE_OAUTH_CLIENT_SECRET"), required("GOOGLE_OAUTH_REDIRECT_URI"));
}

export function encryptRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptRefreshToken(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted) throw new Error("Invalid encrypted Google Drive token");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

export function createOAuthState(input: Omit<OAuthState, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({ ...input, expiresAt: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", required("GOOGLE_DRIVE_OAUTH_STATE_SECRET")).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string): OAuthState | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", required("GOOGLE_DRIVE_OAUTH_STATE_SECRET")).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export async function createStudioRootFolder(accessToken: string, studioName: string) {
  const client = oauthClient();
  client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth: client });
  const response = await drive.files.create({
    requestBody: { name: studioName, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  if (!response.data.id) throw new Error("Google Drive did not return a root folder ID");
  return response.data.id;
}

export async function getStudioDriveConnection(studioId: string): Promise<DriveConnection | null> {
  const { data, error } = await createAdminClient().from("studio_google_drive_connections").select("root_folder_id,refresh_token_ciphertext").eq("studio_id", studioId).maybeSingle();
  if (error) throw error;
  return data;
}

export function getStudioDriveClient(connection: DriveConnection) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: decryptRefreshToken(connection.refresh_token_ciphertext) });
  return google.drive({ version: "v3", auth: client });
}
