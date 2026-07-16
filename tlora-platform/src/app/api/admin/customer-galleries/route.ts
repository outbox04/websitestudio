import { NextResponse } from "next/server";
import { driveFolderIdFromUrl, driveFolderUrl } from "@/lib/customer-gallery-scope";
import { createCustomerDriveFolders, createCustomerDriveFoldersInStudioDrive } from "@/lib/google-drive";
import type { CustomerDriveFolders } from "@/lib/google-drive";
import { getGalleryUrls, publicOriginFromHeaders } from "@/lib/public-origin";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext } from "@/lib/studio-admin";
import { getStudioDriveClient, getStudioDriveConnection } from "@/lib/studio-google-drive";
import { requireTloraStudioId } from "@/lib/tlora-studio";

export const runtime = "nodejs";

function publicOrigin(request: Request) {
  return publicOriginFromHeaders(request.headers) || new URL(request.url).origin;
}

type StudioJoin = { slug: string; studio_type?: string } | { slug: string; studio_type?: string }[] | null;

type AdminCustomerGalleryRow = {
  id: string;
  customer_name: string;
  customer_name_slug: string;
  share_token?: string | null;
  studios?: StudioJoin;
};

type SelectedPhotoRow = {
  gallery_id: string;
  file_name: string;
};

type CustomerGalleryInsert = {
  customer_name: string;
  customer_name_slug: string;
  shoot_date: string;
  root_drive_folder_id: string;
  raw_drive_folder_id: string;
  edited_drive_folder_id: string;
  root_drive_folder_url: string;
  raw_drive_folder_url: string;
  edited_drive_folder_url: string;
  edited_download_enabled: boolean;
  studio_id?: string;
};

function joinedStudioSlug(studios: StudioJoin | undefined) {
  if (!studios) return null;
  const studio = Array.isArray(studios) ? studios[0] : studios;
  return studio?.studio_type === "tenant" ? studio.slug : null;
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
    const auth = await checkAuthContext(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { context } = auth;
    const targetStudioId = context?.studioId || await requireTloraStudioId();

    const supabase = createAdminClient();
    
    let galleriesQuery = supabase
      .from("customer_galleries")
      .select(
        "id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled,share_token,created_at,updated_at,studio_id,studios(slug,studio_type)",
      )
      .order("created_at", { ascending: false });

    let photosQuery = supabase
      .from("customer_gallery_photos")
      .select("gallery_id,file_name,customer_galleries!inner(studio_id)")
      .eq("selected", true)
      .eq("kind", "raw")
      .order("file_name", { ascending: true });

    galleriesQuery = galleriesQuery.eq("studio_id", targetStudioId);
    photosQuery = photosQuery.eq("customer_galleries.studio_id", targetStudioId);

    const [{ data, error }, { data: selectedPhotosData, error: selectedPhotosError }] = await Promise.all([
      galleriesQuery,
      photosQuery,
    ]);

    if (error) {
      throw error;
    }

    if (selectedPhotosError) {
      throw selectedPhotosError;
    }

    const selectedFilesByGalleryId = new Map<string, string[]>();

    for (const photo of (selectedPhotosData || []) as SelectedPhotoRow[]) {
      const existing = selectedFilesByGalleryId.get(photo.gallery_id) || [];
      existing.push(photo.file_name);
      selectedFilesByGalleryId.set(photo.gallery_id, existing);
    }

    return NextResponse.json({
      galleries: ((data || []) as AdminCustomerGalleryRow[]).map((gallery) => {
        const origin = publicOrigin(request);
        const galleryStudioSlug = joinedStudioSlug(gallery.studios);
        const urls = getGalleryUrls(gallery.customer_name_slug, galleryStudioSlug, origin, gallery.share_token);
        return {
          ...gallery,
          customerUrl: urls.customerUrl,
          customerDoneUrl: urls.customerDoneUrl,
          selected_photo_file_names: selectedFilesByGalleryId.get(gallery.id) || [],
          selected_photo_count: selectedFilesByGalleryId.get(gallery.id)?.length || 0,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, shootDate, rawDriveFolderUrl, editedDriveFolderUrl } = (await request.json()) as {
      name?: string;
      shootDate?: string;
      rawDriveFolderUrl?: string;
      editedDriveFolderUrl?: string;
    };

    if (!name?.trim() || !shootDate) {
      return NextResponse.json({ error: "Tên và ngày chụp là bắt buộc" }, { status: 400 });
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json({ error: "Tên không hợp lệ để tạo slug" }, { status: 400 });
    }

    const auth = await checkAuthContext(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { context } = auth;
    const targetStudioId = context?.studioId || await requireTloraStudioId();

    const supabase = createAdminClient();
    const origin = publicOrigin(request);
    const studioSlug = context?.studioSlug || null;

    let checkQuery = supabase
      .from("customer_galleries")
      .select("*")
      .eq("customer_name_slug", slug);

    checkQuery = checkQuery.eq("studio_id", targetStudioId);

    const { data: existingGallery, error: existingError } = await checkQuery.maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingGallery) {
      return NextResponse.json({
        gallery: existingGallery,
        ...getGalleryUrls(slug, studioSlug, origin, existingGallery.share_token),
        reused: true,
      });
    }

    let folders: CustomerDriveFolders | undefined;
    let connection: Awaited<ReturnType<typeof getStudioDriveConnection>> = null;
    if (context) {
      try {
        connection = await getStudioDriveConnection(context.studioId);
      } catch {}
    }

    const rawFolderId = driveFolderIdFromUrl(rawDriveFolderUrl || "");
    const editedFolderId = driveFolderIdFromUrl(editedDriveFolderUrl || "");

    if (rawFolderId && editedFolderId) {
      folders = {
        rootFolderId: rawFolderId,
        rawFolderId,
        editedFolderId,
        rootFolderUrl: driveFolderUrl(rawFolderId),
        rawFolderUrl: driveFolderUrl(rawFolderId),
        editedFolderUrl: driveFolderUrl(editedFolderId),
      };
    } else if (process.env.GOOGLE_OAUTH_CLIENT_ID && connection && !connection.root_folder_id.startsWith("mock-")) {
      folders = await createCustomerDriveFoldersInStudioDrive(getStudioDriveClient(connection!), connection.root_folder_id, name.trim());
    } else if (!context) {
      folders = await createCustomerDriveFolders(name.trim());
    } else {
      return NextResponse.json(
        { error: "Hãy kết nối Google Drive cho studio hoặc dán link folder FILE GỐC và FILE CHỈNH thật." },
        { status: 400 },
      );
    }

    const insertData: CustomerGalleryInsert = {
      customer_name: name.trim(),
      customer_name_slug: slug,
      shoot_date: shootDate,
      root_drive_folder_id: folders.rootFolderId,
      raw_drive_folder_id: folders.rawFolderId,
      edited_drive_folder_id: folders.editedFolderId,
      root_drive_folder_url: folders.rootFolderUrl,
      raw_drive_folder_url: folders.rawFolderUrl,
      edited_drive_folder_url: folders.editedFolderUrl,
      edited_download_enabled: false,
    };

    insertData.studio_id = targetStudioId;

    const { data, error } = await supabase
      .from("customer_galleries")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      gallery: data,
      ...getGalleryUrls(slug, studioSlug, origin, data.share_token),
      reused: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
