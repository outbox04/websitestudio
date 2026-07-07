import { NextResponse } from "next/server";
import { listDriveImages } from "@/lib/google-drive";

export async function POST(request: Request) {
  const { folderId } = (await request.json()) as { folderId?: string };

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  try {
    const files = await listDriveImages(folderId);
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
