import { NextResponse } from "next/server";
import { getStudioDriveConnection } from "@/lib/studio-google-drive";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
    const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
    if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const connection = await getStudioDriveConnection(context.studioId);
    return NextResponse.json({ connected: Boolean(connection), rootFolderId: connection?.root_folder_id || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể kiểm tra Google Drive." }, { status: 500 });
  }
}
