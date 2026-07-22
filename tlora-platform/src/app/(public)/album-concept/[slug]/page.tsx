import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConceptAlbumDetail } from "@/components/public/concept-album-detail";
import { buildTloraPageMetadata } from "@/lib/tlora-metadata";
import { listPublishedTloraConceptAlbums } from "@/repositories/tlora/concept-albums-repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/album-concept/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const album = (await listPublishedTloraConceptAlbums()).find((item) => item.slug === slug);
  if (!album) return { title: "Album không tồn tại | TLORA Studio" };
  const description = album.excerpt || `Xem trọn bộ ảnh ${album.title} tại TLORA Studio.`;
  return buildTloraPageMetadata({ title: album.title, description, ogImageUrl: album.coverImageUrl }, `/album-concept/${album.slug}`, { title: `${album.title} | Album Concept`, description });
}

export default async function ConceptAlbumPage({ params }: PageProps<"/album-concept/[slug]">) {
  const { slug } = await params;
  const albums = await listPublishedTloraConceptAlbums();
  const album = albums.find((item) => item.slug === slug);
  if (!album) notFound();
  const similarAlbums = albums.filter((item) => item.id !== album.id && item.categoryId && item.categoryId === album.categoryId);
  const categoryHighlights = Array.from(new Map(albums.filter((item) => item.id !== album.id && item.categoryId !== album.categoryId).map((item) => [item.categoryId || item.categorySlug || item.id, item])).values());
  return <ConceptAlbumDetail album={album} similarAlbums={similarAlbums} categoryHighlights={categoryHighlights} />;
}
