import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { SePayPgClient } from "sepay-pg-node";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const plans = { basic: 2000, medium: 3000, premium: 4000 } as const;
type PlanId = keyof typeof plans;

type CheckoutBody = {
  plan?: string;
  studioName?: string;
  representativeName?: string;
  email?: string;
  phone?: string;
  username?: string;
  password?: string;
  domain?: string;
};

export async function POST(request: Request) {
  if (!process.env.SEPAY_MERCHANT_ID || !process.env.SEPAY_SECRET_KEY) {
    return NextResponse.json({ error: "Chưa cấu hình SePay trên máy chủ." }, { status: 503 });
  }

  const body = await request.json() as CheckoutBody;
  if (!body.plan || !(body.plan in plans)) {
    return NextResponse.json({ error: "Gói thanh toán không hợp lệ." }, { status: 400 });
  }

  const plan = body.plan as PlanId;
  const email = body.email?.trim().toLowerCase() || "";
  const username = body.username?.trim().toLowerCase() || "";
  const phone = body.phone?.trim() || "";
  const password = body.password || "";
  const studioName = body.studioName?.trim() || "Studio mới";
  const representativeName = body.representativeName?.trim() || studioName;
  const domain = body.domain?.trim().toLowerCase() || null;

  if (!email || !username || !phone || password.length < 8) {
    return NextResponse.json({ error: "Vui lòng điền đủ email, số điện thoại, tên đăng nhập và mật khẩu tối thiểu 8 ký tự." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: representativeName, username, role: "admin" },
  });
  if (createUserError || !createdUser.user) {
    return NextResponse.json({ error: "Email hoặc tên đăng nhập này đã được sử dụng. Vui lòng chọn thông tin khác." }, { status: 409 });
  }

  const rollbackUser = async () => { await admin.auth.admin.deleteUser(createdUser.user.id); };
  const { error: profileError } = await admin.from("profiles").update({
    full_name: representativeName,
    phone,
    username,
    role: "admin",
    is_active: false,
  }).eq("id", createdUser.user.id);
  if (profileError) {
    await rollbackUser();
    return NextResponse.json({ error: "Không thể khởi tạo tài khoản Studio." }, { status: 500 });
  }

  const orderId = `TLORA-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const { error: orderError } = await admin.from("studio_payment_orders").insert({
    order_id: orderId,
    studio_name: studioName,
    plan,
    amount_vnd: plans[plan],
    representative_name: representativeName,
    email,
    phone,
    username,
    domain,
    owner_user_id: createdUser.user.id,
  });
  if (orderError) {
    await rollbackUser();
    return NextResponse.json({ error: "Không lưu được đơn thanh toán Studio." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const client = new SePayPgClient({
    env: process.env.SEPAY_ENV === "sandbox" ? "sandbox" : "production",
    merchant_id: process.env.SEPAY_MERCHANT_ID,
    secret_key: process.env.SEPAY_SECRET_KEY,
  });
  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: orderId,
    order_amount: plans[plan],
    currency: "VND",
    order_description: `TLORA Studio ${plan.toUpperCase()} - ${studioName.slice(0, 80)}`,
    success_url: `${origin}/thanh-toan/${orderId}`,
    error_url: `${origin}/thanh-toan/${orderId}?payment=error`,
    cancel_url: `${origin}/thanh-toan/${orderId}?payment=cancel`,
    custom_data: JSON.stringify({ plan, orderId }),
  });

  return NextResponse.json({ checkoutUrl: client.checkout.initCheckoutUrl(), fields, orderId });
}
