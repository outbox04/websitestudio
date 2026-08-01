/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function highResolutionDriveUrl(url: string) {
  if (!url.includes("drive.google.com/thumbnail")) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("sz", "w1600");
  return parsed.toString();
}

async function loadFallbackLogo() {
  return readFile(join(process.cwd(), "public", "brand", "tlora-logo.png"));
}

export async function GET(request: Request, { params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  let customerName = customerSlug;
  let image: ArrayBuffer | Uint8Array = await loadFallbackLogo();

  try {
    const { query } = await scopedGalleryQuery(request.headers, customerSlug);
    const { data: gallery } = await query.select("id,customer_name,cover_url").maybeSingle();

    if (gallery) {
      customerName = gallery.customer_name;
      let imageUrl = gallery.cover_url?.trim() || "";

      if (!imageUrl) {
        const supabase = createAdminClient();
        const { data: photo } = await supabase
          .from("customer_gallery_photos")
          .select("preview_url,thumbnail_url")
          .eq("gallery_id", gallery.id)
          .not("drive_file_id", "like", "mock-%")
          .order("file_name", { ascending: true })
          .limit(1)
          .maybeSingle();
        imageUrl = photo?.preview_url || photo?.thumbnail_url || "";
      }

      if (imageUrl.startsWith("https://")) {
        const response = await fetch(highResolutionDriveUrl(imageUrl), {
          redirect: "follow",
          cache: "no-store",
          headers: { "User-Agent": "TLORA-OG-Image/1.0" },
        });
        if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
          image = await response.arrayBuffer();
        }
      }
    }
  } catch {
    // The branded fallback still produces a valid social card when Drive is unavailable.
  }

  return new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: "#07080a", overflow: "hidden" }}>
      {/* @ts-expect-error ImageResponse supports ArrayBuffer and Uint8Array image sources. */}
      <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "52px 64px", color: "#f8f5ee", background: "linear-gradient(to bottom, transparent 42%, rgba(7,8,10,0.92) 100%)" }}>
        <div style={{ color: "#d8b766", fontSize: 25, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>TLORA Studio · Album ảnh</div>
        <div style={{ marginTop: 12, fontSize: 58, fontWeight: 800, lineHeight: 1.05 }}>{customerName}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
