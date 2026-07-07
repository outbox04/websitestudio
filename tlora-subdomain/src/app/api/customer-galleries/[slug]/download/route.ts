import { ZipArchive } from "archiver";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { getDriveClient, listDriveImages } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DownloadKind = "raw" | "edited";

function isDownloadKind(value: string | null): value is DownloadKind {
  return value === "raw" || value === "edited";
}

function safeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, " ").trim() || "image";
}

function safeZipName(name: string, kind: DownloadKind) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${normalized || "album"}-${kind === "raw" ? "file-goc" : "file-da-chinh"}.zip`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const kind = request.nextUrl.searchParams.get("kind");

  if (!isDownloadKind(kind)) {
    return NextResponse.json({ error: "kind must be raw or edited" }, { status: 400 });
  }

  const { slug } = await params;
  const { query } = await scopedGalleryQuery(request.headers, slug);
  const { data: gallery, error } = await query
    .select("customer_name,raw_drive_folder_id,edited_drive_folder_id,raw_download_enabled,edited_download_enabled")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const enabled = kind === "raw" ? gallery.raw_download_enabled : gallery.edited_download_enabled;
  if (!enabled) {
    return NextResponse.json({ error: "Download is locked" }, { status: 403 });
  }

  const folderId = kind === "raw" ? gallery.raw_drive_folder_id : gallery.edited_drive_folder_id;
  const files = await listDriveImages(folderId);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const drive = getDriveClient();

  void (async () => {
    try {
      for (const file of files) {
        const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "stream" });
        archive.append(response.data, { name: safeFileName(file.name) });
      }
      await archive.finalize();
    } catch (downloadError) {
      archive.destroy(downloadError instanceof Error ? downloadError : new Error("Could not download gallery files"));
    }
  })();

  return new NextResponse(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeZipName(gallery.customer_name, kind)}"`,
      "Cache-Control": "no-store",
    },
  });
}
