import { NextResponse } from "next/server";
import { createStudioRootFolder, encryptRefreshToken, getStudioDriveConnection, oauthClient, verifyOAuthState } from "@/lib/studio-google-drive";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function studioAdminUrl(studioSlug: string, result: "connected" | "error") {
  const rootDomain = process.env.ROOT_DOMAIN || "tlgroup.site";
  return new URL(`/quan-tri?drive=${result}`, `https://${studioSlug}.${rootDomain}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const verified = state ? verifyOAuthState(state) : null;
  if (!verified || !code) return NextResponse.redirect(new URL("/dang-nhap?drive=error", url.origin));

  try {
    const admin = createAdminClient();
    const { data: membership, error: membershipError } = await admin
      .from("studio_members")
      .select("studio_id")
      .eq("studio_id", verified.studioId)
      .eq("user_id", verified.userId)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .maybeSingle();
    if (membershipError || !membership) throw new Error("Bạn không còn quyền kết nối Drive cho studio này.");

    const client = oauthClient();
    const { tokens } = await client.getToken(code);
    const existing = await getStudioDriveConnection(verified.studioId);
    const refreshToken = tokens.refresh_token || (existing ? undefined : null);
    if (!refreshToken && !existing) throw new Error("Google không trả về refresh token. Hãy thử kết nối lại.");

    if (!existing && !tokens.access_token) throw new Error("Google không trả về access token.");
    const rootFolderId = existing?.root_folder_id || await createStudioRootFolder(tokens.access_token!, verified.studioName);
    const refreshTokenCiphertext = refreshToken ? encryptRefreshToken(refreshToken) : existing!.refresh_token_ciphertext;
    const { error } = await admin.from("studio_drive_connections").upsert({
      studio_id: verified.studioId,
      root_folder_id: rootFolderId,
      refresh_token_ciphertext: refreshTokenCiphertext,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      connected_by: verified.userId,
    }, { onConflict: "studio_id" });
    if (error) throw error;

    return NextResponse.redirect(studioAdminUrl(verified.studioSlug, "connected"));
  } catch {
    return NextResponse.redirect(studioAdminUrl(verified.studioSlug, "error"));
  }
}
