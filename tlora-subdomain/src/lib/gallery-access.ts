import "server-only";

import { timingSafeEqual } from "node:crypto";

export function galleryTokenFromUrl(requestUrl: string) {
  return new URL(requestUrl).searchParams.get("token")?.trim() || "";
}

export function hasValidGalleryToken(expectedToken: string | null | undefined, providedToken: string | null | undefined) {
  if (!expectedToken || !providedToken) return false;

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function galleryTokenQuery(token: string) {
  return `token=${encodeURIComponent(token)}`;
}
