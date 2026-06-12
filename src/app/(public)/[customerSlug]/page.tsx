import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerGalleryView } from "@/components/customer/customer-gallery-view";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ customerSlug: string }> }): Promise<Metadata> {
  const { customerSlug } = await params;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("customer_galleries")
      .select("customer_name")
      .eq("customer_name_slug", customerSlug)
      .maybeSingle();

    return {
      title: data?.customer_name ? `${data.customer_name} - TLORA Studio Gallery` : "TLORA Studio Gallery",
    };
  } catch {
    return { title: "TLORA Studio Gallery" };
  }
}

export default async function CustomerGalleryPage({ params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
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
      .order("file_name", { ascending: true });

    gallery = galleryData;
    photos = photosData || [];
  } catch {
    notFound();
  }

  const rawPhotos = photos.filter((photo) => photo.kind === "raw");
  const editedPhotos = photos.filter((photo) => photo.kind === "edited");

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} />;
}
