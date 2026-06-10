import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const minTopUp = 50_000;
const maxTopUp = 10_000_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để nạp tiền" }, { status: 401 });
  }

  const { amountVnd } = (await request.json()) as { amountVnd?: number };
  const amount = Number(amountVnd);

  if (!Number.isInteger(amount) || amount < minTopUp || amount > maxTopUp) {
    return NextResponse.json({ error: "Số tiền nạp phải từ 50.000đ đến 10.000.000đ" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credit_balance_vnd")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    const { error: insertError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      role: "customer",
      credit_balance_vnd: 0,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const nextBalance = (profile?.credit_balance_vnd || 0) + amount;
  const { data: updatedProfile, error: updateError } = await admin
    .from("profiles")
    .update({ credit_balance_vnd: nextBalance })
    .eq("id", user.id)
    .select("credit_balance_vnd")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("wallet_transactions").insert({
    user_id: user.id,
    amount_vnd: amount,
    type: "top_up",
    note: "Nạp tiền demo từ trang AI Concept",
  });

  return NextResponse.json({ balanceVnd: updatedProfile.credit_balance_vnd });
}
