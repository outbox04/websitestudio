import { createCustomerDriveFolders } from "@/lib/google-drive";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateTloraRequest, errorMessage, json, options, publicOrigin, unauthorized } from "@/lib/tlora-api";

export const runtime = "nodejs";

type TloraAlbumPayload = {
  albumName?: string;
  customerName?: string;
  driveFileGocUrl?: string;
  driveFileChinhSuaUrl?: string;
  websiteUrl?: string;
  createdAt?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function customerUrl(origin: string, slug: string) {
  return `${origin.replace(/\/$/, "")}/${slug}`;
}

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateTloraRequest(request);
    if (!auth) return unauthorized();
    const supabase = createAdminClient();
    const studioId = auth.studioId;
    const origin = publicOrigin(request);
    const { data, error } = await supabase
      .from("customer_galleries")
      .select(
        "id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,created_at,updated_at",
      )
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return json({
      ok: true,
      albums: (data || []).map((gallery) => ({
        id: gallery.id,
        albumName: gallery.customer_name,
        customerName: gallery.customer_name,
        slug: gallery.customer_name_slug,
        shootDate: gallery.shoot_date,
        driveFileGocUrl: gallery.raw_drive_folder_url,
        driveFileChinhSuaUrl: gallery.edited_drive_folder_url,
        websiteUrl: customerUrl(origin, gallery.customer_name_slug),
        createdAt: gallery.created_at,
        updatedAt: gallery.updated_at,
      })),
    });
  } catch (error) {
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TloraAlbumPayload;
  const albumName = payload.albumName?.trim() || payload.customerName?.trim();
  if (!albumName) {
    return json({ error: "albumName hoặc customerName là bắt buộc" }, { status: 400 });
  }

  const slug = createSlug(albumName);
  if (!slug) {
    return json({ error: "Không tạo được slug từ tên album" }, { status: 400 });
  }

  try {
    const auth = await authenticateTloraRequest(request);
    if (!auth) return unauthorized();
    const supabase = createAdminClient();
    const studioId = auth.studioId;
    const origin = publicOrigin(request);

    const { data: existing, error: existingError } = await supabase
      .from("customer_galleries")
      .select("*")
      .eq("customer_name_slug", slug)
      .eq("studio_id", studioId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return json({
        ok: true,
        reused: true,
        gallery: existing,
        websiteUrl: payload.websiteUrl || customerUrl(origin, slug),
        driveFileGocUrl: existing.raw_drive_folder_url,
        driveFileChinhSuaUrl: existing.edited_drive_folder_url,
      });
    }

    const folders = await createCustomerDriveFolders(albumName);
    const { data, error } = await supabase
      .from("customer_galleries")
      .insert({
        customer_name: albumName,
        customer_name_slug: slug,
        shoot_date: payload.createdAt?.slice(0, 10) || today(),
        root_drive_folder_id: folders.rootFolderId,
        raw_drive_folder_id: folders.rawFolderId,
        edited_drive_folder_id: folders.editedFolderId,
        root_drive_folder_url: folders.rootFolderUrl,
        raw_drive_folder_url: folders.rawFolderUrl,
        edited_drive_folder_url: folders.editedFolderUrl,
        edited_download_enabled: false,
        studio_id: studioId,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return json({
      ok: true,
      reused: false,
      gallery: data,
      websiteUrl: customerUrl(origin, slug),
      driveFileGocUrl: folders.rawFolderUrl,
      driveFileChinhSuaUrl: folders.editedFolderUrl,
    });
  } catch (error) {
    return json({ error: errorMessage(error) }, { status: 500 });
  }
}
