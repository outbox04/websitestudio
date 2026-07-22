import type { Metadata } from "next";
import { ConceptAlbumsView } from "@/components/public/concept-albums-view";
import { buildTloraPageMetadata } from "@/lib/tlora-metadata";
import { listPublishedTloraConceptAlbums, listPublishedTloraConceptCategories } from "@/repositories/tlora/concept-albums-repository";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("albums");
  return buildTloraPageMetadata(meta, "/album-concept", { title: "Album Concept | TLORA Studio", description: "Khám phá các album concept tiêu biểu và đăng ký tư vấn." });
}

export const dynamic = "force-dynamic";

export default async function ConceptAlbumsPage() {
  const [albums, categories, content] = await Promise.all([
    listPublishedTloraConceptAlbums(),
    listPublishedTloraConceptCategories(),
    getPublishedTloraSection("home", "gallery"),
  ]);
  const text = (key: string, fallback: string) => {
    const values = content.text as Record<string, unknown> | undefined;
    return typeof values?.[key] === "string" ? String(values[key]) : fallback;
  };
  return (
    <main className="min-h-screen bg-[#07080a] px-4 py-16 text-[#f8f5ee] sm:px-6 lg:px-8">
      <header className="mx-auto max-w-6xl pb-12"><p data-cms-section="gallery" data-cms-field="text.albumPage.label" className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b766]">{text("albumPage.label", "Bộ sưu tập concept")}</p><h1 data-cms-section="gallery" data-cms-field="text.albumPage.title" className="mt-4 max-w-4xl text-4xl font-black md:text-6xl">{text("albumPage.title", "Mỗi album là một cách kể câu chuyện của riêng bạn")}</h1><p data-cms-section="gallery" data-cms-field="text.albumPage.description" className="mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">{text("albumPage.description", "Xem trọn từng bộ ảnh, cảm nhận màu sắc và bối cảnh, sau đó chọn concept gần nhất với hình ảnh bạn đang mong muốn.")}</p></header>
      <div className="mx-auto max-w-6xl">{albums.length ? <ConceptAlbumsView albums={albums} categories={categories} /> : <p className="rounded-xl border border-dashed border-white/15 p-10 text-center text-[#8c8174]">Album Concept đang được cập nhật.</p>}</div>
    </main>
  );
}
