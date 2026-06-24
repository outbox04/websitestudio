import { NextResponse } from "next/server";
import { createCustomerDriveFoldersInStudioDrive } from "@/lib/google-drive";
import { customerDoneUrlFromOrigin, customerUrlFromOrigin, publicOriginFromHeaders } from "@/lib/public-origin";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";
import { getStudioDriveClient, getStudioDriveConnection } from "@/lib/studio-google-drive";

export const runtime = "nodejs";

function publicOrigin(request: Request) {
  return publicOriginFromHeaders(request.headers) || new URL(request.url).origin;
}

function customerUrl(request: Request, slug: string) {
  return customerUrlFromOrigin(publicOrigin(request), slug);
}

function customerDoneUrl(request: Request, slug: string) {
  return customerDoneUrlFromOrigin(publicOrigin(request), slug);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const message = [record.message, record.details, record.hint, record.code]
      .filter(Boolean)
      .join(" - ");

    if (message) {
      return message;
    }

    return JSON.stringify(record);
  }

  return "Không tạo được thư mục khách hàng";
}

export async function GET(request: Request) {
  try {
    const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
    const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
    if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabase = createAdminClient();
    const [{ data, error }, { data: selectedPhotosData, error: selectedPhotosError }] = await Promise.all([
      supabase
        .from("customer_galleries")
        .select(
          "id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled,created_at,updated_at",
        )
        .eq("studio_id", context.studioId)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_gallery_photos")
        .select("gallery_id,file_name,customer_galleries!inner(studio_id)")
        .eq("customer_galleries.studio_id", context.studioId)
        .eq("selected", true)
        .eq("kind", "raw")
        .order("file_name", { ascending: true }),
    ]);

    if (error) {
      throw error;
    }

    if (selectedPhotosError) {
      throw selectedPhotosError;
    }

    const selectedFilesByGalleryId = new Map<string, string[]>();

    for (const photo of selectedPhotosData || []) {
      const existing = selectedFilesByGalleryId.get(photo.gallery_id) || [];
      existing.push(photo.file_name);
      selectedFilesByGalleryId.set(photo.gallery_id, existing);
    }

    return NextResponse.json({
      galleries: (data || []).map((gallery) => ({
        ...gallery,
        customerUrl: customerUrl(request, gallery.customer_name_slug),
        customerDoneUrl: customerDoneUrl(request, gallery.customer_name_slug),
        selected_photo_file_names: selectedFilesByGalleryId.get(gallery.id) || [],
        selected_photo_count: selectedFilesByGalleryId.get(gallery.id)?.length || 0,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, shootDate } = (await request.json()) as {
    name?: string;
    shootDate?: string;
  };

  if (!name?.trim() || !shootDate) {
    return NextResponse.json({ error: "Tên và ngày chụp là bắt buộc" }, { status: 400 });
  }

  const slug = createSlug(name);

  if (!slug) {
    return NextResponse.json({ error: "Tên không hợp lệ để tạo slug" }, { status: 400 });
  }

  try {
    const studioSlug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
    const context = studioSlug ? await getStudioAdminContext(studioSlug) : null;
    if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabase = createAdminClient();
    const url = customerUrl(request, slug);

    const { data: existingGallery, error: existingError } = await supabase
      .from("customer_galleries")
      .select("*")
      .eq("studio_id", context.studioId)
      .eq("customer_name_slug", slug)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingGallery) {
      return NextResponse.json({
        gallery: existingGallery,
        customerUrl: url,
        customerDoneUrl: customerDoneUrl(request, slug),
        reused: true,
      });
    }

    let folders;
    const connection = await getStudioDriveConnection(context.studioId);
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID || (connection && connection.root_folder_id.startsWith("mock-"))) {
      folders = {
        rootFolderId: `mock-root-${slug}`,
        rawFolderId: `mock-raw-${slug}`,
        editedFolderId: `mock-edited-${slug}`,
        rootFolderUrl: `https://drive.google.com/drive/folders/mock-root-${slug}`,
        rawFolderUrl: `https://drive.google.com/drive/folders/mock-raw-${slug}`,
        editedFolderUrl: `https://drive.google.com/drive/folders/mock-edited-${slug}`,
      };
    } else {
      if (!connection) return NextResponse.json({ error: "Hãy kết nối Google Drive trước khi tạo album." }, { status: 400 });
      folders = await createCustomerDriveFoldersInStudioDrive(getStudioDriveClient(connection), connection.root_folder_id, name.trim());
    }

    const { data, error } = await supabase
      .from("customer_galleries")
      .insert({
        customer_name: name.trim(),
        customer_name_slug: slug,
        studio_id: context.studioId,
        shoot_date: shootDate,
        root_drive_folder_id: folders.rootFolderId,
        raw_drive_folder_id: folders.rawFolderId,
        edited_drive_folder_id: folders.editedFolderId,
        root_drive_folder_url: folders.rootFolderUrl,
        raw_drive_folder_url: folders.rawFolderUrl,
        edited_drive_folder_url: folders.editedFolderUrl,
        edited_download_enabled: false,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      gallery: data,
      customerUrl: url,
      customerDoneUrl: customerDoneUrl(request, slug),
      reused: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
