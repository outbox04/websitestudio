import { NextResponse } from "next/server";
import { getSizeAvailability } from "@/lib/rental/availability";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const sizes = await getSizeAvailability(productId);
  return NextResponse.json(
    { productId, sizes, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
