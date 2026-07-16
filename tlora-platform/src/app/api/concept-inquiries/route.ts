import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { conceptInquirySchema } from "@/schemas/tlora-cms";
import { checkRateLimit, rateLimitHeaders, requestClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`concept-inquiry:${requestClientKey(request)}`, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
  }

  try {
    const input = conceptInquirySchema.parse(await request.json());
    const admin = createAdminClient();
    const { data: studio, error: studioError } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").single();
    if (studioError) throw studioError;
    const { error } = await admin.from("tlora_concept_inquiries").insert({
      studio_id: studio.id,
      album_id: input.albumId || null,
      customer_name: input.customerName,
      phone: input.phone,
      shooting_date: input.shootingDate || null,
      note: input.note || null,
    });
    if (error) throw error;
    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Thông tin chưa hợp lệ hoặc chưa thể gửi lúc này." }, { status: 400 });
  }
}
