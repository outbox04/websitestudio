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

    const title = data?.customer_name ? `${data.customer_name} - TLORA Studio Gallery` : "TLORA Studio Gallery";
    const description = data?.customer_name ? `Album ảnh cá nhân dành riêng cho ${data.customer_name} tại TLORA Studio.` : "Cổng xem và chọn ảnh trực tuyến của khách hàng tại TLORA Studio.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ["/brand/tlora-logo.png"],
      },
    };
  } catch {
    const title = "TLORA Studio Gallery";
    const description = "Cổng xem và chọn ảnh trực tuyến của khách hàng tại TLORA Studio.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ["/brand/tlora-logo.png"],
      },
    };
  }
}

export default async function CustomerGalleryPage({ params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  const { gallery, rawPhotos, editedPhotos } = await getCustomerGalleryPageData(customerSlug);

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} />;
}
