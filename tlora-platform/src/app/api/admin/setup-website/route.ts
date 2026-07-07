import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
    const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;

    if (!context) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("studios")
      .update({
        settings: {
          ...(context.settings || {}),
          setup_completed: true,
        },
        status: "active",
      })
      .eq("id", context.studioId);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: "Website đã được bật. Hãy cập nhật nội dung thật trong trang quản trị.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể hoàn tất thiết lập website." },
      { status: 500 },
    );
  }
}
