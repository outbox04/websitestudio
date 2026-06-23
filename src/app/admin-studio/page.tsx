import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminStudioWorkspace, type AdminEditRequest, type AdminGallery } from "@/components/admin/admin-studio-workspace";
import { customerDoneUrlFromOrigin, customerUrlFromOrigin, publicOriginFromHeaders } from "@/lib/public-origin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "TLORA Admin",
  description: "Dashboard quản lý khách hàng, album, ảnh cần sửa, tin tức và AI workflow.",
  openGraph: {
    title: "TLORA Admin",
    description: "Dashboard quản lý khách hàng, album, ảnh cần sửa, tin tức và AI workflow.",
    images: ["/brand/tlora-logo.png"],
  },
};

export const dynamic = "force-dynamic";

type CustomerGalleryRow = {
  id: string;
  customer_name: string;
  customer_name_slug: string;
  shoot_date: string;
  raw_drive_folder_url: string;
  edited_drive_folder_url: string;
  raw_download_enabled: boolean;
  edited_download_enabled: boolean;
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

async function getAdminGalleryData(): Promise<{
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  databaseError?: string;
}> {
  try {
    const supabase = createAdminClient();
    const siteUrl = publicOriginFromHeaders(await headers());

    const [{ data: galleriesData, error: galleriesError }, { data: photosData, error: photosError }] = await Promise.all([
      supabase
        .from("customer_galleries")
        .select("id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled")
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_gallery_photos")
        .select("id,gallery_id,file_name,preview_url,download_url,kind,selected,edit_note,updated_at")
        .order("updated_at", { ascending: false }),
    ]);

    if (galleriesError) {
      throw galleriesError;
    }

    if (photosError) {
      throw photosError;
    }

    const galleriesRows = (galleriesData || []) as CustomerGalleryRow[];
    const photosRows = (photosData || []) as CustomerGalleryPhotoRow[];
    const galleryById = new Map(galleriesRows.map((gallery) => [gallery.id, gallery]));

    const galleries = galleriesRows.map((gallery) => {
      const galleryPhotos = photosRows.filter((photo) => photo.gallery_id === gallery.id);
      const rawPhotos = galleryPhotos.filter((photo) => photo.kind === "raw");
      const selectedPhotos = rawPhotos.filter((photo) => photo.selected);
      const editedPhotos = galleryPhotos.filter((photo) => photo.kind === "edited");

      return {
        id: gallery.id,
        customerName: gallery.customer_name,
        customerSlug: gallery.customer_name_slug,
        shootDate: gallery.shoot_date,
        customerUrl: customerUrlFromOrigin(siteUrl, gallery.customer_name_slug),
        customerDoneUrl: customerDoneUrlFromOrigin(siteUrl, gallery.customer_name_slug),
        rawDriveUrl: gallery.raw_drive_folder_url,
        editedDriveUrl: gallery.edited_drive_folder_url,
        rawDownloadEnabled: gallery.raw_download_enabled,
        editedDownloadEnabled: gallery.edited_download_enabled,
        rawPhotoCount: rawPhotos.length,
        selectedPhotoCount: selectedPhotos.length,
        editedPhotoCount: editedPhotos.length,
      };
    });

    const editRequests = photosRows
      .filter((photo) => photo.kind === "raw")
      .filter((photo) => photo.selected || Boolean(photo.edit_note?.trim()))
      .map((photo) => {
        const gallery = galleryById.get(photo.gallery_id);

        if (!gallery) {
          return null;
        }

        return {
          id: photo.id,
          galleryId: photo.gallery_id,
          customerName: gallery.customer_name,
          customerSlug: gallery.customer_name_slug,
          shootDate: gallery.shoot_date,
          customerUrl: customerUrlFromOrigin(siteUrl, gallery.customer_name_slug),
          customerDoneUrl: customerDoneUrlFromOrigin(siteUrl, gallery.customer_name_slug),
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

export default async function AdminStudioPage() {
  const { galleries, editRequests, databaseError } = await getAdminGalleryData();

  return <AdminStudioWorkspace galleries={galleries} editRequests={editRequests} databaseError={databaseError} />;
}
