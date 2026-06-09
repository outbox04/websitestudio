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
      title: data?.customer_name ? `${data.customer_name} - TLORA Gallery` : "TLORA Gallery",
    };
  } catch {
    return { title: "TLORA Gallery" };
  }
}

export default async function CustomerGalleryPage({ params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  const supabase = createAdminClient();

  const { data: gallery } = await supabase
    .from("customer_galleries")
    .select("*")
    .eq("customer_name_slug", customerSlug)
    .maybeSingle();

  if (!gallery) {
    notFound();
  }

  const { data: photos } = await supabase
    .from("customer_gallery_photos")
    .select("*")
    .eq("gallery_id", gallery.id)
    .order("file_name", { ascending: true });

  const rawPhotos = (photos || []).filter((photo) => photo.kind === "raw");
  const editedPhotos = (photos || []).filter((photo) => photo.kind === "edited");

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} />;
}
