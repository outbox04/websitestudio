import type { Metadata } from "next";

type TloraPageMeta = { title: string; description: string; ogImageUrl: string };

export function buildTloraPageMetadata(meta: TloraPageMeta, canonicalPath: string, fallback: { title: string; description: string }): Metadata {
  const ogTitle = meta.title.trim();
  const ogDescription = meta.description.trim();
  const image = meta.ogImageUrl.trim();
  const images = image ? [{ url: image, width: 1200, height: 675, alt: ogTitle }] : [];

  return {
    title: ogTitle || fallback.title,
    description: ogDescription || fallback.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "TLORA Studio",
      url: canonicalPath,
      title: ogTitle || undefined,
      description: ogDescription || undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle || undefined,
      description: ogDescription || undefined,
      images: image ? [image] : [],
    },
  };
}
