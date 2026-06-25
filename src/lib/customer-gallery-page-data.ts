import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCustomerGalleryPageData(customerSlug: string) {
  let gallery;
  let photos;

  try {
    const supabase = createAdminClient();

    const { data: galleryData } = await supabase
      .from("customer_galleries")
      .select("*")
      .eq("customer_name_slug", customerSlug)
      .maybeSingle();

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
