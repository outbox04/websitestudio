import { NextResponse } from "next/server";

export const revalidate = 86400;

type VietQrBank = {
  id: number;
  name: string;
  code: string;
  bin: string;
  short_name: string;
  logo?: string;
};

export async function GET() {
  try {
    const response = await fetch("https://api.vietqr.io/v2/banks", { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Không tải được danh sách ngân hàng từ VietQR.");
    const payload = await response.json() as { data?: VietQrBank[] };
    const banks = (payload.data || []).filter((bank) => bank.bin && bank.short_name).map((bank) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      bin: bank.bin,
      shortName: bank.short_name,
      logo: bank.logo || "",
    }));
    return NextResponse.json({ banks });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không tải được danh sách ngân hàng." }, { status: 502 });
  }
}
