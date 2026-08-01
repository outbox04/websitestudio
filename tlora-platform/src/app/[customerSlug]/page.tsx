import type { Metadata } from "next";
import { headers } from "next/headers";
import { CustomerGalleryView } from "@/components/customer/customer-gallery-view";
import { getCustomerGalleryPageData } from "@/lib/customer-gallery-page-data";
import { scopedGalleryQuery } from "@/lib/customer-gallery-scope";
import { publicOriginFromHeaders } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ customerSlug: string }>;
}): Promise<Metadata> {
  const { customerSlug } = await params;
  const requestHeaders = await headers();
  const origin = publicOriginFromHeaders(requestHeaders);
  const pageUrl = `${origin}/${customerSlug}`;
  const imageUrl = `${pageUrl}/og`;

  try {
    const { query } = await scopedGalleryQuery(requestHeaders, customerSlug);
    const { data } = await query.select("customer_name,shoot_date").maybeSingle();

    const title = data?.customer_name ? `Album ảnh ${data.customer_name}` : "Album ảnh TLORA Studio";
    const shootDate = data?.shoot_date ? new Date(data.shoot_date).toLocaleDateString("vi-VN") : null;
    const description = data?.customer_name
      ? `Xem và chọn ảnh trong album của ${data.customer_name}${shootDate ? `, chụp ngày ${shootDate}` : ""} tại TLORA Studio.`
      : "Cổng xem và chọn ảnh trực tuyến của khách hàng tại TLORA Studio.";
    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        type: "website",
        url: pageUrl,
        siteName: "TLORA Studio",
        locale: "vi_VN",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title, type: "image/png" }],
      },
      twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    };
  } catch {
    const title = "TLORA Studio Gallery";
    const description = "Cổng xem và chọn ảnh trực tuyến của khách hàng tại TLORA Studio.";
    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        type: "website",
        url: pageUrl,
        siteName: "TLORA Studio",
        locale: "vi_VN",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title, type: "image/png" }],
      },
      twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    };
  }
}

export default async function CustomerGalleryPage({
  params,
}: {
  params: Promise<{ customerSlug: string }>;
}) {
  const { customerSlug } = await params;
  const { gallery, rawPhotos, editedPhotos } = await getCustomerGalleryPageData(customerSlug, await headers());

  return <CustomerGalleryView gallery={gallery} rawPhotos={rawPhotos} editedPhotos={editedPhotos} />;
}
