import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { SePayPgClient } from "sepay-pg-node";

export const runtime = "nodejs";

const plans = {
  basic: 2000,
  medium: 3000,
  premium: 4000,
} as const;

type PlanId = keyof typeof plans;

export async function POST(request: Request) {
  if (!process.env.SEPAY_MERCHANT_ID || !process.env.SEPAY_SECRET_KEY) {
    return NextResponse.json({ error: "Chưa cấu hình SePay Merchant ID và Secret Key trên máy chủ." }, { status: 503 });
  }

  const body = (await request.json()) as { plan?: string; studioName?: string };
  if (!body.plan || !(body.plan in plans)) {
    return NextResponse.json({ error: "Gói thanh toán không hợp lệ." }, { status: 400 });
  }

  const plan = body.plan as PlanId;
  const orderId = `TLORA-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const origin = new URL(request.url).origin;
  const environment = process.env.SEPAY_ENV === "sandbox" ? "sandbox" : "production";
  const client = new SePayPgClient({
    env: environment,
    merchant_id: process.env.SEPAY_MERCHANT_ID,
    secret_key: process.env.SEPAY_SECRET_KEY,
  });

  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: orderId,
    order_amount: plans[plan],
    currency: "VND",
    order_description: `TLORA Studio ${plan.toUpperCase()}${body.studioName?.trim() ? ` - ${body.studioName.trim().slice(0, 80)}` : ""}`,
    success_url: `${origin}/thanh-toan/${orderId}`,
    error_url: `${origin}/thanh-toan/${orderId}?payment=error`,
    cancel_url: `${origin}/thanh-toan/${orderId}?payment=cancel`,
    custom_data: JSON.stringify({ plan, orderId }),
  });

  return NextResponse.json({ checkoutUrl: client.checkout.initCheckoutUrl(), fields, orderId });
}
