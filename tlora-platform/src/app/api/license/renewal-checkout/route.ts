import { randomUUID } from "crypto";
import { SePayPgClient } from "sepay-pg-node";
import { publicOriginFromHeaders } from "@/lib/public-origin";
import {
  authenticatedUser,
  durationDaysForLicense,
  licenseJson,
  licenseOptions,
  normalizeLicenseKey,
} from "../_shared";

export const runtime = "nodejs";

const defaultPrices: Record<number, number> = {
  30: 99_000,
  90: 249_000,
  365: 899_000,
};

function renewalPrices() {
  const raw = process.env.LICENSE_RENEWAL_PRICES_VND;
  if (!raw) return defaultPrices;

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([days, amount]) => [Number(days), Number(amount)] as const)
        .filter(([days, amount]) => Number.isInteger(days) && days > 0 && Number.isInteger(amount) && amount > 0),
    );
  } catch {
    return defaultPrices;
  }
}

export function OPTIONS() {
  return licenseOptions();
}

export async function POST(request: Request) {
  if (!process.env.SEPAY_MERCHANT_ID || !process.env.SEPAY_SECRET_KEY) {
    return licenseJson({ ok: false, message: "Chưa cấu hình SePay trên máy chủ." }, 503);
  }

  const auth = await authenticatedUser(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const licenseKey = normalizeLicenseKey(body.licenseKey);
    const requestedDays = Number(body.durationDays || 0);
    const supabase = auth.supabase;
    const user = auth.user;

    const { data: license, error: licenseError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (licenseError) throw licenseError;
    if (!license) return licenseJson({ ok: false, message: "License không tồn tại." }, 404);
    if (license.user_id && license.user_id !== user.id) {
      return licenseJson({ ok: false, message: "License đã được gắn với tài khoản khác." }, 403);
    }
    if (license.status === "suspended") {
      return licenseJson({ ok: false, message: "License đang bị tạm khóa, không thể gia hạn tự động." }, 403);
    }

    const prices = renewalPrices();
    const fallbackDays = durationDaysForLicense(license);
    const durationDays = requestedDays > 0 ? requestedDays : fallbackDays;
    const amountVnd = prices[durationDays];

    if (!amountVnd) {
      return licenseJson({
        ok: false,
        message: "Gói gia hạn không hợp lệ.",
        availableDurations: Object.keys(prices).map(Number).sort((a, b) => a - b),
      }, 400);
    }

    const orderId = `TLORA-REN-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const { error: orderError } = await supabase.from("license_renewal_orders").insert({
      order_id: orderId,
      license_id: license.id,
      user_id: user.id,
      amount_vnd: amountVnd,
      duration_days: durationDays,
      status: "pending",
      previous_expires_at: license.expires_at,
      metadata: { licenseKey },
    });

    if (orderError) throw orderError;

    const origin = publicOriginFromHeaders(request.headers) || new URL(request.url).origin;
    const client = new SePayPgClient({
      env: process.env.SEPAY_ENV === "sandbox" ? "sandbox" : "production",
      merchant_id: process.env.SEPAY_MERCHANT_ID,
      secret_key: process.env.SEPAY_SECRET_KEY,
    });
    const fields = client.checkout.initOneTimePaymentFields({
      operation: "PURCHASE",
      payment_method: "BANK_TRANSFER",
      order_invoice_number: orderId,
      order_amount: amountVnd,
      currency: "VND",
      order_description: `Gia han TLORA Selector ${durationDays} ngay - ${licenseKey}`,
      success_url: `${origin}/thanh-toan/${orderId}`,
      error_url: `${origin}/thanh-toan/${orderId}?payment=error`,
      cancel_url: `${origin}/thanh-toan/${orderId}?payment=cancel`,
      custom_data: JSON.stringify({ type: "license_renewal", orderId, licenseKey, durationDays }),
    });

    return licenseJson({
      ok: true,
      checkoutUrl: client.checkout.initCheckoutUrl(),
      fields,
      orderId,
      amountVnd,
      durationDays,
      licenseKey,
    });
  } catch (error) {
    return licenseJson({ ok: false, message: error instanceof Error ? error.message : String(error) }, 500);
  }
}
