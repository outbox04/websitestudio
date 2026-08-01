import type { Metadata } from "next";
import { headers } from "next/headers";
import { CustomerGalleryView } from "@/components/customer/customer-gallery-view";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { getCustomerGalleryPageData } from "@/lib/customer-gallery-page-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ customerSlug: string }>;
}): Promise<Metadata> {
  const { customerSlug } = await params;

  try {
    const { query } = await scopedGalleryQuery(await headers(), customerSlug);
    const { data } = await query.select("customer_name").maybeSingle();

    const title = data?.customer_name ? `${data.customer_name} - File hoàn thiện` : "File hoàn thiện - TLORA Studio";
    const description = data?.customer_name ? `Album ảnh hoàn thiện chất lượng cao dành riêng cho ${data.customer_name} tại TLORA Studio.` : "Tải ảnh hoàn thiện chất lượng cao tại TLORA Studio.";

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        images: ["/brand/tlora-logo.png"],
      },
    };
  } catch {
    const title = "File hoàn thiện - TLORA Studio";
    const description = "Tải ảnh hoàn thiện chất lượng cao tại TLORA Studio.";
    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        images: ["/brand/tlora-logo.png"],
      },
    };
  }
}

export default async function CustomerGalleryDonePage({
  params,
}: {
  params: Promise<{ customerSlug: string }>;
}) {
  const { customerSlug } = await params;
  const { gallery, rawPhotos, editedPhotos } = await getCustomerGalleryPageData(customerSlug, await headers());

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} initialTab="edited" />;
}
