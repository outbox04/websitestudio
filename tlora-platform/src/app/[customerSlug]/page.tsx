import type { Metadata } from "next";
import { headers } from "next/headers";
import { CustomerGalleryView } from "@/components/customer/customer-gallery-view";
import { getCustomerGalleryPageData } from "@/lib/customer-gallery-page-data";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ customerSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}): Promise<Metadata> {
  const { customerSlug } = await params;
  const { token = "" } = await searchParams;

  try {
    const { query } = await scopedGalleryQuery(await headers(), customerSlug);
    const { data } = await query.select("customer_name").eq("share_token", token).maybeSingle();

    const title = data?.customer_name ? `${data.customer_name} - TLORA Studio Gallery` : "TLORA Studio Gallery";
    const description = data?.customer_name ? `Album ảnh cá nhân dành riêng cho ${data.customer_name} tại TLORA Studio.` : "Cổng xem và chọn ảnh trực tuyến của khách hàng tại TLORA Studio.";

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
    const title = "TLORA Studio Gallery";
    const description = "Cổng xem và chọn ảnh trực tuyến của khách hàng tại TLORA Studio.";
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

export default async function CustomerGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { customerSlug } = await params;
  const { token = "" } = await searchParams;
  const { gallery, rawPhotos, editedPhotos } = await getCustomerGalleryPageData(customerSlug, token, await headers());

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} shareToken={token} />;
}
