import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaymentSettings = {
  bank_bin: string;
  bank_name: string;
  account_number: string;
  account_name: string;
};

const fields = "bank_bin,bank_name,account_number,account_name";

export async function GET() {
  try {
    const { data, error } = await createAdminClient().from("payment_settings").select(fields).eq("id", 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ settings: data || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không đọc được cấu hình thanh toán" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const settings = (await request.json()) as PaymentSettings;
    const values = Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, value.trim()]));
    if (!values.bank_bin || !values.bank_name || !values.account_number || !values.account_name) {
      return NextResponse.json({ error: "Vui lòng điền đủ thông tin ngân hàng." }, { status: 400 });
    }
    const { data, error } = await createAdminClient().from("payment_settings").upsert({ id: 1, ...values }, { onConflict: "id" }).select(fields).single();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không lưu được cấu hình thanh toán" }, { status: 500 });
  }
}
