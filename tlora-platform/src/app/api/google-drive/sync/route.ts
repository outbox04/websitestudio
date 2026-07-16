import { NextResponse } from "next/server";
import { listDriveImages } from "@/lib/google-drive";
import { checkAuthContext } from "@/lib/studio-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await checkAuthContext(request);
  if (auth.errorResponse || !auth.context) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { folderId } = (await request.json()) as { folderId?: string };

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: gallery } = await admin
      .from("customer_galleries")
      .select("id")
      .eq("studio_id", auth.context.studioId)
      .or(`raw_drive_folder_id.eq.${folderId},edited_drive_folder_id.eq.${folderId}`)
      .maybeSingle();
    if (!gallery) return NextResponse.json({ error: "Folder not found" }, { status: 404 });

    const files = await listDriveImages(folderId);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "Không thể đồng bộ Google Drive." }, { status: 500 });
  }
}
