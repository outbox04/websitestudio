import { notFound } from "next/navigation";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { getAllGalleryPhotos } from "@/lib/customer-gallery-photos";
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

    const photosData = await getAllGalleryPhotos(supabase, galleryData.id);

    gallery = galleryData;
    photos = photosData;
  } catch {
    notFound();
  }

  return {
    gallery,
    rawPhotos: photos.filter((photo) => photo.kind === "raw"),
    editedPhotos: photos.filter((photo) => photo.kind === "edited"),
  };
}
