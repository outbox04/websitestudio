import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { createTloraMedia, deleteTloraMedia, listTloraMedia, updateTloraMediaMetadata } from "@/repositories/tlora/media-repository";
import { cmsMediaMetadataSchema } from "@/schemas/tlora-cms";
import { createAdminClient } from "@/lib/supabase/admin";
import { inspectImageBuffer, safeUploadBaseName } from "@/lib/image-upload";

const maxBytes = 8 * 1024 * 1024;

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ media: await listTloraMedia(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 });
    if (file.size <= 0 || file.size > maxBytes) return NextResponse.json({ error: "Ảnh phải nhỏ hơn hoặc bằng 8MB." }, { status: 413 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const inspected = inspectImageBuffer(buffer);
    if (!inspected) return NextResponse.json({ error: "Nội dung tệp không phải JPEG, PNG hoặc WebP hợp lệ." }, { status: 415 });
    const { altText } = cmsMediaMetadataSchema.parse({ altText: form.get("altText") || "" });
    const width = Math.max(0, Number(form.get("width") || 0));
    const height = Math.max(0, Number(form.get("height") || 0));
    const safeBase = safeUploadBaseName(file.name);
    const storagePath = `${context.studio.id}/${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeBase}.${inspected.extension}`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from("tlora-cms-media").upload(storagePath, buffer, {
      contentType: inspected.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicData } = admin.storage.from("tlora-cms-media").getPublicUrl(storagePath);
    try {
      const media = await createTloraMedia({
        studioId: context.studio.id,
        userId: context.userId!,
        storagePath,
        publicUrl: publicData.publicUrl,
        fileName: file.name,
        mimeType: inspected.mime,
        sizeBytes: file.size,
        width: width || undefined,
        height: height || undefined,
        altText,
      });
      return NextResponse.json({ media }, { status: 201 });
    } catch (error) {
      await admin.storage.from("tlora-cms-media").remove([storagePath]);
      throw error;
    }
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const mediaId = new URL(request.url).searchParams.get("id");
    if (!mediaId) return NextResponse.json({ error: "Missing media id" }, { status: 400 });
    await deleteTloraMedia(context.studio.id, mediaId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const body = await request.json() as { id?: string; altText?: string; description?: string };
    if (!body.id) return NextResponse.json({ error: "Thiếu media id." }, { status: 400 });
    const media = await updateTloraMediaMetadata(context.studio.id, body.id, String(body.altText || "").slice(0, 300), String(body.description || "").slice(0, 1000));
    return NextResponse.json({ media });
  } catch (error) {
    return tloraApiError(error);
  }
}
