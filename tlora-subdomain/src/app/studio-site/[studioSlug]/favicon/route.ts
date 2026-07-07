import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { data: studio } = await createAdminClient().from("studios").select("settings").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  const logo = studio?.settings?.logo_url as string | undefined;
  if (!logo) return NextResponse.redirect(new URL("/favicon.ico", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  if (logo.startsWith("data:")) {
    const [header, data] = logo.split(",", 2); const mime = header.match(/^data:([^;]+)/)?.[1] || "image/png";
    return new NextResponse(Buffer.from(data || "", "base64"), { headers: { "Content-Type": mime, "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(logo);
}
