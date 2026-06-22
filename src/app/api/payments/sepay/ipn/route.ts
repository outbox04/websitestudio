import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function equalsSecret(value: string | null, secret: string) {
  if (!value) return false;
  const received = Buffer.from(value); const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return request.headers.get("x-api-key") || request.headers.get("x-sepay-secret");
}

export async function POST(request: Request) {
  const secret = process.env.SEPAY_IPN_SECRET;
  if (!secret) return NextResponse.json({ error: "IPN chưa được cấu hình trên máy chủ." }, { status: 503 });
  if (!equalsSecret(bearerToken(request), secret)) return NextResponse.json({ error: "IPN secret không hợp lệ." }, { status: 401 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const orderId = String(payload.order_invoice_number || payload.orderId || payload.order_id || "").trim();
    const status = String(payload.order_status || payload.status || payload.transaction_status || "").toLowerCase();
    const amount = Number(payload.order_amount || payload.amount || 0);
    if (!orderId) return NextResponse.json({ error: "Thiếu mã đơn hàng." }, { status: 400 });
    if (!["paid", "success", "completed", "complete"].includes(status)) return NextResponse.json({ ok: true, ignored: true });

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
