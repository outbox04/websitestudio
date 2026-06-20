import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { SePayPgClient } from "sepay-pg-node";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await createAdminClient().from("customer_galleries").select("payment_status,total_cost_vnd,deposit_paid_vnd,raw_download_enabled,edited_download_enabled").eq("customer_name_slug", slug).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Không tìm thấy album." }, { status: 404 });
  return NextResponse.json({ ...data, remaining_vnd: Math.max(data.total_cost_vnd - data.deposit_paid_vnd, 0) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!process.env.SEPAY_MERCHANT_ID || !process.env.SEPAY_SECRET_KEY) return NextResponse.json({ error: "Chưa cấu hình SePay." }, { status: 503 });
  const admin = createAdminClient(); const { data: gallery, error } = await admin.from("customer_galleries").select("id,customer_name,total_cost_vnd,deposit_paid_vnd").eq("customer_name_slug", slug).maybeSingle();
  const amount = Math.max((gallery?.total_cost_vnd || 0) - (gallery?.deposit_paid_vnd || 0), 0);
  if (error || !gallery || amount <= 0) return NextResponse.json({ error: "Album không có khoản thanh toán còn lại." }, { status: 400 });
  const orderId = `ALBUM-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`; const origin = new URL(request.url).origin;
  const client = new SePayPgClient({ env: process.env.SEPAY_ENV === "sandbox" ? "sandbox" : "production", merchant_id: process.env.SEPAY_MERCHANT_ID, secret_key: process.env.SEPAY_SECRET_KEY });
  const fields = client.checkout.initOneTimePaymentFields({ operation: "PURCHASE", payment_method: "BANK_TRANSFER", order_invoice_number: orderId, order_amount: amount, currency: "VND", order_description: `Thanh toán album ${gallery.customer_name}`, success_url: `${origin}/${slug}?payment=return`, cancel_url: `${origin}/${slug}?payment=cancel` });
  await admin.from("customer_galleries").update({ payment_status: "pending", payment_order_id: orderId }).eq("id", gallery.id);
  return NextResponse.json({ checkoutUrl: client.checkout.initCheckoutUrl(), fields });
}
