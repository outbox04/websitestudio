import type { Metadata } from "next";
import { CustomerGalleryView } from "@/components/customer/customer-gallery-view";
import { getCustomerGalleryPageData } from "@/lib/customer-gallery-page-data";
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
      title: data?.customer_name ? `${data.customer_name} - File hoàn thiện` : "File hoàn thiện - TLORA Studio",
    };
  } catch {
    return { title: "File hoàn thiện - TLORA Studio" };
  }
}

export default async function CustomerGalleryDonePage({ params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  const { gallery, rawPhotos, editedPhotos } = await getCustomerGalleryPageData(customerSlug);

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} initialTab="edited" />;
}
