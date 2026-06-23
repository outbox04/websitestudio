import { NextResponse } from "next/server";
import { createOAuthState, oauthClient } from "@/lib/studio-google-drive";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
    const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
    if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const state = createOAuthState(context);
    const url = oauthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: ["https://www.googleapis.com/auth/drive.file"],
      state,
    });
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể bắt đầu kết nối Google Drive." }, { status: 500 });
  }
}
