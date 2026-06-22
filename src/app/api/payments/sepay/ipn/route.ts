import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendActivationEmail } from "@/lib/gmail";

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
    if (!gallery) {
      const { data: studioOrder, error: studioOrderError } = await admin.from("studio_payment_orders").select("id,amount_vnd,studio_name,plan,email,username,domain,license_key,activation_email_sent_at").eq("order_id", orderId).maybeSingle();
      if (studioOrderError) throw studioOrderError;
      if (!studioOrder) return NextResponse.json({ error: "Không tìm thấy đơn thanh toán." }, { status: 404 });
      if (amount && amount !== studioOrder.amount_vnd) return NextResponse.json({ error: "Số tiền IPN không khớp đơn Studio." }, { status: 400 });
      const licenseKey = studioOrder.license_key || `TLORA-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
      const { error: licenseError } = await admin.from("licenses").upsert({
        license_key: licenseKey,
        status: "active",
        plan: studioOrder.plan,
        max_devices: 1,
        metadata: { orderId, studioName: studioOrder.studio_name, domain: studioOrder.domain || null },
      }, { onConflict: "license_key" });
      if (licenseError) throw licenseError;
      const { error: updateStudioError } = await admin.from("studio_payment_orders").update({ status: "paid", paid_at: new Date().toISOString(), transaction_id: String((payload as { transaction?: { transaction_id?: string } }).transaction?.transaction_id || ""), license_key: licenseKey }).eq("id", studioOrder.id);
      if (updateStudioError) throw updateStudioError;
      if (studioOrder.email && !studioOrder.activation_email_sent_at) {
        await sendActivationEmail({ to: studioOrder.email, studioName: studioOrder.studio_name, orderId, plan: studioOrder.plan.toUpperCase(), domain: studioOrder.domain || "tlgroup.site", username: studioOrder.username || "Đang khởi tạo", licenseKey });
        await admin.from("studio_payment_orders").update({ activation_email_sent_at: new Date().toISOString() }).eq("id", studioOrder.id);
      }
      return NextResponse.json({ ok: true, orderId, type: "studio" });
    }
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
