import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminStudioWorkspace, type AdminEditRequest, type AdminGallery } from "@/components/admin/admin-studio-workspace";
import { customerDoneUrlFromOrigin, customerUrlFromOrigin, publicOriginFromHeaders } from "@/lib/public-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext } from "@/lib/studio-admin";

export const dynamic = "force-dynamic";

export default async function StudioAdminPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const context = await getStudioAdminContext(studioSlug);
  if (!context) redirect("/dang-nhap?redirect=/quan-tri");

  const siteUrl = publicOriginFromHeaders(await headers());
  const admin = createAdminClient();
  const [{ data: galleriesData, error: galleriesError }, { data: photosData, error: photosError }] = await Promise.all([
    admin.from("customer_galleries").select("id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled").eq("studio_id", context.studioId).order("created_at", { ascending: false }),
    admin.from("customer_gallery_photos").select("id,gallery_id,file_name,preview_url,download_url,kind,selected,edit_note,updated_at,customer_galleries!inner(studio_id)").eq("customer_galleries.studio_id", context.studioId).order("updated_at", { ascending: false }),
  ]);

  const photos = photosData || [];
  const galleries: AdminGallery[] = (galleriesData || []).map((gallery) => {
    const galleryPhotos = photos.filter((photo) => photo.gallery_id === gallery.id);
    return {
      id: gallery.id, customerName: gallery.customer_name, customerSlug: gallery.customer_name_slug, shootDate: gallery.shoot_date,
      customerUrl: customerUrlFromOrigin(siteUrl, gallery.customer_name_slug), customerDoneUrl: customerDoneUrlFromOrigin(siteUrl, gallery.customer_name_slug),
      rawDriveUrl: gallery.raw_drive_folder_url, editedDriveUrl: gallery.edited_drive_folder_url,
      rawDownloadEnabled: gallery.raw_download_enabled, editedDownloadEnabled: gallery.edited_download_enabled,
      rawPhotoCount: galleryPhotos.filter((photo) => photo.kind === "raw").length,
      selectedPhotoCount: galleryPhotos.filter((photo) => photo.kind === "raw" && photo.selected).length,
      editedPhotoCount: galleryPhotos.filter((photo) => photo.kind === "edited").length,
    };
  });
  const galleryById = new Map(galleries.map((gallery) => [gallery.id, gallery]));
  const editRequests: AdminEditRequest[] = photos.filter((photo) => photo.kind === "raw" && (photo.selected || Boolean(photo.edit_note?.trim()))).flatMap((photo) => {
    const gallery = galleryById.get(photo.gallery_id);
    return gallery ? [{ id: photo.id, galleryId: gallery.id, customerName: gallery.customerName, customerSlug: gallery.customerSlug, shootDate: gallery.shootDate, customerUrl: gallery.customerUrl, customerDoneUrl: gallery.customerDoneUrl, fileName: photo.file_name, editNote: photo.edit_note, previewUrl: photo.preview_url, downloadUrl: photo.download_url, updatedAt: photo.updated_at, selected: photo.selected }] : [];
  });

  const databaseError = galleriesError || photosError ? "Không thể đọc dữ liệu studio." : undefined;
  return <AdminStudioWorkspace galleries={galleries} editRequests={editRequests} databaseError={databaseError} studioName={context.studioName} tenantMode />;
}
