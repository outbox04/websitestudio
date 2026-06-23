import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const username = url.searchParams.get("username")?.trim().toLowerCase();
  const phone = url.searchParams.get("phone")?.replace(/\s/g, "");
  if (!email && !username && !phone) return NextResponse.json({ emailTaken: false, usernameTaken: false, phoneTaken: false });
  try {
    const admin = createAdminClient();
    const [profileResult, orderResult, profileUsernameResult, profilePhoneResult, orderPhoneResult] = await Promise.all([
      email ? admin.from("profiles").select("id").eq("email", email).maybeSingle() : Promise.resolve({ data: null, error: null }),
      username ? admin.from("studio_payment_orders").select("id").eq("username", username).maybeSingle() : Promise.resolve({ data: null, error: null }),
      username ? admin.from("profiles").select("id").eq("username", username).maybeSingle() : Promise.resolve({ data: null, error: null }),
      phone ? admin.from("profiles").select("id").eq("phone", phone).maybeSingle() : Promise.resolve({ data: null, error: null }),
      phone ? admin.from("studio_payment_orders").select("id").eq("phone", phone).in("status", ["pending", "paid"]).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (profileResult.error || orderResult.error || profileUsernameResult.error || profilePhoneResult.error || orderPhoneResult.error) {
      throw profileResult.error || orderResult.error || profileUsernameResult.error || profilePhoneResult.error || orderPhoneResult.error;
    }
    return NextResponse.json({
      emailTaken: Boolean(profileResult.data),
      usernameTaken: Boolean(orderResult.data || profileUsernameResult.data),
      phoneTaken: Boolean(profilePhoneResult.data || orderPhoneResult.data),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không kiểm tra được dữ liệu." }, { status: 500 });
  }
}
