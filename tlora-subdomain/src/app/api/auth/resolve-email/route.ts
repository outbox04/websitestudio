import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitHeaders, requestClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(`resolve-email:${requestClientKey(request)}`, 10, 60 * 1000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rateLimit) });

  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username")?.trim().toLowerCase();
    
    if (!username) {
      return NextResponse.json({ error: "Thiếu tên đăng nhập." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("email")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Không thể xử lý yêu cầu đăng nhập." }, { status: 500 });
    }

    return NextResponse.json({ email: data?.email || null });
  } catch {
    return NextResponse.json({ error: "Không thể xử lý yêu cầu đăng nhập." }, { status: 500 });
  }
}
