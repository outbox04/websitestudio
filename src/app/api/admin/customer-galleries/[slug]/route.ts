import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { rawDownloadEnabled } = (await request.json()) as {
    rawDownloadEnabled?: boolean;
  };

  if (typeof rawDownloadEnabled !== "boolean") {
    return NextResponse.json({ error: "rawDownloadEnabled is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_galleries")
    .update({ raw_download_enabled: rawDownloadEnabled })
    .eq("customer_name_slug", slug)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gallery: data });
}
