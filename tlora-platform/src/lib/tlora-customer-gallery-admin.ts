import "server-only";

import { headers } from "next/headers";
import type { AdminEditRequest, AdminGallery } from "@/components/admin/admin-studio-workspace";
import { getGalleryUrls, publicOriginFromHeaders } from "@/lib/public-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTloraStudioId } from "@/lib/tlora-studio";

type CustomerGalleryRow = {
  id: string;
  customer_name: string;
  customer_name_slug: string;
  shoot_date: string;
  raw_drive_folder_url: string;
  edited_drive_folder_url: string;
  raw_download_enabled: boolean;
  edited_download_enabled: boolean;
  share_token?: string | null;
  studios?: { slug: string; studio_type?: string } | { slug: string; studio_type?: string }[] | null;
};

type CustomerGalleryPhotoRow = {
  id: string;
  gallery_id: string;
  file_name: string;
  preview_url: string | null;
  download_url: string | null;
  kind: "raw" | "edited";
  selected: boolean;
  edit_note: string | null;
  updated_at: string;
};

export async function loadTloraCustomerGalleryAdminData(): Promise<{
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  databaseError?: string;
}> {
  try {
    const supabase = createAdminClient();
    const studioId = await requireTloraStudioId();
    const siteUrl = publicOriginFromHeaders(await headers());
    const [{ data: galleryData, error: galleryError }, { data: photoData, error: photoError }] = await Promise.all([
      supabase
        .from("customer_galleries")
        .select("id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled,share_token,studios(slug,studio_type)")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_gallery_photos")
        .select("id,gallery_id,file_name,preview_url,download_url,kind,selected,edit_note,updated_at,customer_galleries!inner(studio_id)")
        .eq("customer_galleries.studio_id", studioId)
        .order("updated_at", { ascending: false }),
    ]);

    if (galleryError) throw galleryError;
    if (photoError) throw photoError;

    const galleriesRows = (galleryData || []) as unknown as CustomerGalleryRow[];
    const photosRows = (photoData || []) as CustomerGalleryPhotoRow[];
    const galleryById = new Map(galleriesRows.map((gallery) => [gallery.id, gallery]));

    function galleryUrls(gallery: CustomerGalleryRow) {
      const joinedStudio = Array.isArray(gallery.studios) ? gallery.studios[0] : gallery.studios;
      return getGalleryUrls(
        gallery.customer_name_slug,
        joinedStudio?.studio_type === "tenant" ? joinedStudio.slug : null,
        siteUrl,
      );
    }

    const galleries = galleriesRows.map((gallery) => {
      const photos = photosRows.filter((photo) => photo.gallery_id === gallery.id);
      const rawPhotos = photos.filter((photo) => photo.kind === "raw");
      const editedPhotos = photos.filter((photo) => photo.kind === "edited");
      const urls = galleryUrls(gallery);
      return {
        id: gallery.id,
        customerName: gallery.customer_name,
        customerSlug: gallery.customer_name_slug,
        shootDate: gallery.shoot_date,
        customerUrl: urls.customerUrl,
        customerDoneUrl: urls.customerDoneUrl,
        rawDriveUrl: gallery.raw_drive_folder_url,
        editedDriveUrl: gallery.edited_drive_folder_url,
        rawDownloadEnabled: gallery.raw_download_enabled,
        editedDownloadEnabled: gallery.edited_download_enabled,
        rawPhotoCount: rawPhotos.length,
        selectedPhotoCount: rawPhotos.filter((photo) => photo.selected).length,
        editedPhotoCount: editedPhotos.length,
      };
    });

    const editRequests = photosRows
      .filter((photo) => photo.kind === "raw" && (photo.selected || Boolean(photo.edit_note?.trim())))
      .map((photo) => {
        const gallery = galleryById.get(photo.gallery_id);
        if (!gallery) return null;
        const urls = galleryUrls(gallery);
        return {
          id: photo.id,
          galleryId: photo.gallery_id,
          customerName: gallery.customer_name,
          customerSlug: gallery.customer_name_slug,
          shootDate: gallery.shoot_date,
          customerUrl: urls.customerUrl,
          customerDoneUrl: urls.customerDoneUrl,
          fileName: photo.file_name,
          editNote: photo.edit_note,
          previewUrl: photo.preview_url,
          downloadUrl: photo.download_url,
          updatedAt: photo.updated_at,
          selected: photo.selected,
        };
      })
      .filter((request): request is AdminEditRequest => Boolean(request));

    return { galleries, editRequests };
  } catch (error) {
    return {
      galleries: [],
      editRequests: [],
      databaseError: error instanceof Error ? error.message : "Không đọc được dữ liệu Supabase",
    };
  }
}
