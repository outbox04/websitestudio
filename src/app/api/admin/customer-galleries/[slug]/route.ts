import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { rawDownloadEnabled, editedDownloadEnabled } = (await request.json()) as {
    rawDownloadEnabled?: boolean;
    editedDownloadEnabled?: boolean;
  };

  const patch: {
    raw_download_enabled?: boolean;
    edited_download_enabled?: boolean;
  } = {};

  if (typeof rawDownloadEnabled === "boolean") {
    patch.raw_download_enabled = rawDownloadEnabled;
  }

  if (typeof editedDownloadEnabled === "boolean") {
    patch.edited_download_enabled = editedDownloadEnabled;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "rawDownloadEnabled or editedDownloadEnabled is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_galleries")
    .update(patch)
    .eq("customer_name_slug", slug)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gallery: data });
}
