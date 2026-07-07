import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminStudioWorkspace, type AdminEditRequest, type AdminGallery } from "@/components/admin/admin-studio-workspace";
import { getGalleryUrls, publicOriginFromHeaders } from "@/lib/public-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext } from "@/lib/studio-admin";

export const dynamic = "force-dynamic";

export default async function StudioAdminPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  try {
    const { studioSlug } = await params;
    const context = await getStudioAdminContext(studioSlug);
    if (!context) redirect("/dang-nhap?redirect=/quan-tri");

    const siteUrl = publicOriginFromHeaders(await headers());
    const admin = createAdminClient();
    const [
      { data: galleriesData, error: galleriesError },
      { data: photosData, error: photosError },
      { data: licenseData }
    ] = await Promise.all([
      admin.from("customer_galleries").select("id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled,edited_download_enabled").eq("studio_id", context.studioId).order("created_at", { ascending: false }),
      admin.from("customer_gallery_photos").select("id,gallery_id,file_name,preview_url,download_url,kind,selected,edit_note,updated_at,customer_galleries!inner(studio_id)").eq("customer_galleries.studio_id", context.studioId).order("updated_at", { ascending: false }),
      admin.from("licenses").select("license_key,status,expires_at").eq("studio_id", context.studioId).maybeSingle(),
    ]);
    const photos = photosData || [];
    const galleries: AdminGallery[] = (galleriesData || []).map((gallery) => {
      const galleryPhotos = photos.filter((photo) => photo.gallery_id === gallery.id);
      const urls = getGalleryUrls(gallery.customer_name_slug, studioSlug, siteUrl);
      return {
        id: gallery.id, customerName: gallery.customer_name, customerSlug: gallery.customer_name_slug, shootDate: gallery.shoot_date,
        customerUrl: urls.customerUrl, customerDoneUrl: urls.customerDoneUrl, rawDriveUrl: gallery.raw_drive_folder_url, editedDriveUrl: gallery.edited_drive_folder_url,
        rawDownloadEnabled: gallery.raw_download_enabled, editedDownloadEnabled: gallery.edited_download_enabled, rawPhotoCount: galleryPhotos.filter((photo) => photo.kind === "raw").length,
        selectedPhotoCount: galleryPhotos.filter((photo) => photo.kind === "raw" && photo.selected).length, editedPhotoCount: galleryPhotos.filter((photo) => photo.kind === "edited").length,
      };
    });
    const galleryById = new Map(galleries.map((gallery) => [gallery.id, gallery]));
    const editRequests: AdminEditRequest[] = photos.filter((photo) => photo.kind === "raw" && (photo.selected || Boolean(photo.edit_note?.trim()))).flatMap((photo) => {
      const gallery = galleryById.get(photo.gallery_id);
      return gallery ? [{ id: photo.id, galleryId: gallery.id, customerName: gallery.customerName, customerSlug: gallery.customerSlug, shootDate: gallery.shootDate, customerUrl: gallery.customerUrl, customerDoneUrl: gallery.customerDoneUrl, fileName: photo.file_name, editNote: photo.edit_note, previewUrl: photo.preview_url, downloadUrl: photo.download_url, updatedAt: photo.updated_at, selected: photo.selected }] : [];
    });
    return (
      <AdminStudioWorkspace 
        galleries={galleries} 
        editRequests={editRequests} 
        databaseError={galleriesError || photosError ? "Không thể đọc dữ liệu studio." : undefined} 
        studioName={context.studioName} 
        tenantMode 
        studioSlug={studioSlug} 
        studioSettings={context.settings}
        license={licenseData || null}
      />
    );
  } catch (error: any) {
    if (error && (error.message === "NEXT_REDIRECT" || (typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")))) {
      throw error;
    }
    return (
      <div className="min-h-screen bg-[#14110f] text-[#f4ece0] p-10 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-3xl rounded-2xl border border-red-500/30 bg-[#1c1813] p-8 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3 text-red-500 mb-6">
            <svg className="w-8 h-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-[#f4ece0]">Lỗi Server Component (Debug):</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-black/40 p-4 border border-white/5">
              <p className="text-sm font-bold text-red-400">Message:</p>
              <p className="mt-1 text-sm font-mono break-all">{error.message || "Lỗi không xác định"}</p>
            </div>
            {error.stack && (
              <div className="rounded-lg bg-black/40 p-4 border border-white/5">
                <p className="text-sm font-bold text-[#c99a5e] mb-2">Stack Trace:</p>
                <pre className="text-[11px] leading-relaxed text-[#cbc0b0] whitespace-pre-wrap font-mono overflow-auto max-h-60">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
