import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { conceptInquirySchema } from "@/schemas/tlora-cms";

export async function POST(request: Request) {
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
      email: input.email || null,
      note: input.note || null,
    });
    if (error) throw error;
    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể gửi đăng ký.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
