import { NextResponse } from "next/server";
import { sendActivationEmail } from "@/lib/gmail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email?.includes("@")) return NextResponse.json({ error: "Email nhận không hợp lệ." }, { status: 400 });
    await sendActivationEmail({
      to: email,
      studioName: "TLORA Test Studio",
      orderId: "TLORA-TEST",
      plan: "PREMIUM",
      domain: "test.tlgroup.site",
      username: "tlora-test",
      licenseKey: "TEST-LICENSE-KEY",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không gửi được email thử." }, { status: 500 });
  }
}
