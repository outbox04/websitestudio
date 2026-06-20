import { NextResponse } from "next/server";
import { VietQR } from "vietqr";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const amount = Number(new URL(request.url).searchParams.get("amount"));
  const memo = (new URL(request.url).searchParams.get("memo") || "TLORA Studio").slice(0, 100);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Số tiền không hợp lệ." }, { status: 400 });
  }
  if (!process.env.VIETQR_CLIENT_ID || !process.env.VIETQR_API_KEY) {
    return NextResponse.json({ error: "Chưa cấu hình VietQR API trên máy chủ." }, { status: 503 });
  }
  try {
    const { data: settings, error } = await createAdminClient()
      .from("payment_settings")
      .select("bank_bin,account_number,account_name")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (!settings) return NextResponse.json({ error: "Chưa có tài khoản nhận thanh toán." }, { status: 503 });

    const vietQr = new VietQR({ clientID: process.env.VIETQR_CLIENT_ID, apiKey: process.env.VIETQR_API_KEY });
    const result = await vietQr.genQRCodeBase64({
      bank: settings.bank_bin,
      accountName: settings.account_name,
      accountNumber: settings.account_number,
      amount: amount.toString(),
      memo,
      template: "qr_only",
    });
    const qrDataUrl = result?.data?.qrDataURL;
    if (!qrDataUrl) throw new Error("VietQR không trả về mã QR.");
    return NextResponse.json({ qrDataUrl, accountName: settings.account_name, accountNumber: settings.account_number });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không tạo được mã QR thanh toán." }, { status: 500 });
  }
}
