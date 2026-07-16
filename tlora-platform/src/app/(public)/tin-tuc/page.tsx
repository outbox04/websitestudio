import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFirstPartyStudio } from "@/lib/tenancy/request-context";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";
import { listPublishedTloraPosts } from "@/repositories/tlora/posts-repository";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("news");
  const title = meta.title || "Cảm hứng chụp ảnh concept | TLORA";
  const description = meta.description || "Gợi ý chọn concept, chuẩn bị trang phục và tạo dáng.";
  return { title, description, openGraph: { title, description, images: meta.ogImageUrl ? [meta.ogImageUrl] : ["/brand/tlora-logo.png"] } };
}

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const studio = await getFirstPartyStudio();
  const [posts, content] = await Promise.all([
    studio ? listPublishedTloraPosts(studio.id) : [],
    getPublishedTloraSection("home", "about"),
  ]);
  const text = (key: string, fallback: string) => {
    const values = content.text as Record<string, unknown> | undefined;
    return typeof values?.[key] === "string" ? String(values[key]) : fallback;
  };
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-4xl text-center">
        <h1 data-cms-section="about" data-cms-field="text.newsPage.title" className="text-4xl font-black text-white md:text-6xl">{text("newsPage.title", "Cảm hứng để bạn bước vào buổi chụp tự tin hơn")}</h1>
        <p data-cms-section="about" data-cms-field="text.newsPage.description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">{text("newsPage.description", "Khám phá cách chọn concept, chuẩn bị trang phục, tạo dáng và tìm phong cách hình ảnh phù hợp với chính bạn.")}</p>
      </header>
      <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/tin-tuc/${post.slug}`} data-cms-preview-navigation className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 transition hover:border-[#d8b766]/40">
            {post.coverImageUrl && <div className="aspect-video bg-white/5" style={{ backgroundImage: `url(${post.coverImageUrl})`, backgroundPosition: "center", backgroundSize: "cover" }} />}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8b766]">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN") : "TLORA"}</p>
              <h2 className="mt-3 text-xl font-bold text-white">{post.title}</h2>
              {post.excerpt && <p className="mt-3 text-sm leading-6 text-zinc-400">{post.excerpt}</p>}
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d8b766]">Đọc bài viết <ArrowRight size={15} /></span>
            </div>
          </Link>
        ))}
        {!posts.length && <p className="text-sm text-zinc-400">Những câu chuyện và gợi ý chụp ảnh mới đang được chuẩn bị.</p>}
      </div>
    </section>
  );
}
