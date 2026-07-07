import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Nạp tiền cần đi qua cổng thanh toán thật. Endpoint cộng số dư trực tiếp đã được tắt." },
    { status: 410 },
  );
}
