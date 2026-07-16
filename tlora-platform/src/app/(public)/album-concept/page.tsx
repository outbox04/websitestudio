import type { Metadata } from "next";
import { ConceptAlbumsView } from "@/components/public/concept-albums-view";
import { listPublishedTloraConceptAlbums } from "@/repositories/tlora/concept-albums-repository";

export const metadata: Metadata = {
  title: "Album Concept | TLORA Studio",
  description: "Khám phá các album concept tiêu biểu và đăng ký tư vấn concept phù hợp.",
};

export const dynamic = "force-dynamic";

export default async function ConceptAlbumsPage({ searchParams }: { searchParams: Promise<{ album?: string }> }) {
  const { album } = await searchParams;
  const albums = await listPublishedTloraConceptAlbums();
  return (
    <main className="min-h-screen bg-[#07080a] px-4 py-16 text-[#f8f5ee] sm:px-6 lg:px-8">
      <header className="mx-auto max-w-6xl pb-12"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b766]">TLORA Concept Library</p><h1 className="mt-4 max-w-4xl text-4xl font-black md:text-6xl">Mỗi album là một hướng kể chuyện bằng hình ảnh</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">Xem ảnh tiêu biểu, mở toàn bộ album với hiệu ứng trình chiếu và đăng ký tư vấn concept phù hợp với bạn.</p></header>
      <div className="mx-auto max-w-6xl">{albums.length ? <ConceptAlbumsView albums={albums} initialSlug={album} /> : <p className="rounded-xl border border-dashed border-white/15 p-10 text-center text-[#8c8174]">Album Concept đang được cập nhật.</p>}</div>
    </main>
  );
}
