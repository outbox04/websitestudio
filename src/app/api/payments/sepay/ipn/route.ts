import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { notification_type?: string; order?: { order_invoice_number?: string; order_status?: string; order_amount?: string | number } };
    const orderId = String(payload.order?.order_invoice_number || "").trim();
    const status = String(payload.order?.order_status || "").toLowerCase();
    const amount = Number(payload.order?.order_amount || 0);
    if (!orderId) return NextResponse.json({ error: "Thiếu mã đơn hàng." }, { status: 400 });
    if (payload.notification_type !== "ORDER_PAID" || !["captured", "paid", "success", "completed"].includes(status)) return NextResponse.json({ ok: true, ignored: true });

    const admin = createAdminClient();
    const { data: gallery, error } = await admin
      .from("customer_galleries")
      .select("id,total_cost_vnd,deposit_paid_vnd")
      .eq("payment_order_id", orderId)
      .maybeSingle();
    if (error) throw error;
    if (!gallery) return NextResponse.json({ error: "Không tìm thấy đơn thanh toán." }, { status: 404 });
    const expectedAmount = Math.max(gallery.total_cost_vnd - gallery.deposit_paid_vnd, 0);
    if (amount && amount !== expectedAmount) return NextResponse.json({ error: "Số tiền IPN không khớp đơn hàng." }, { status: 400 });

    const { error: updateError } = await admin.from("customer_galleries").update({
      payment_status: "paid", paid_at: new Date().toISOString(), raw_download_enabled: true, edited_download_enabled: true,
    }).eq("id", gallery.id);
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, orderId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không xử lý được IPN." }, { status: 500 });
  }
}
