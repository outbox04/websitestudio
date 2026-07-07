import { notFound } from "next/navigation";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCustomerGalleryPageData(customerSlug: string, headers: Headers) {
  let gallery;
  let photos;

  try {
    const supabase = createAdminClient();

    const { query } = await scopedGalleryQuery(headers, customerSlug);
    const { data: galleryData } = await query.maybeSingle();

    if (!galleryData) {
      notFound();
    }

    const { data: photosData } = await supabase
      .from("customer_gallery_photos")
      .select("*")
      .eq("gallery_id", galleryData.id)
      .not("drive_file_id", "like", "mock-%")
      .order("file_name", { ascending: true });

    gallery = galleryData;
    photos = photosData || [];
  } catch {
    notFound();
  }

  return {
    gallery,
    rawPhotos: photos.filter((photo) => photo.kind === "raw"),
    editedPhotos: photos.filter((photo) => photo.kind === "edited"),
  };
}
