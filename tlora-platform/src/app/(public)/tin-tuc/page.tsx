import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { getFirstPartyStudio } from "@/lib/tenancy/request-context";
import { listPublishedTloraPosts } from "@/repositories/tlora/posts-repository";

export const metadata: Metadata = {
  title: "Tin tức TLORA",
  description: "Thông tin về chụp ảnh concept, studio tips và quy trình chọn ảnh, retouch.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const studio = await getFirstPartyStudio();
  const posts = studio ? await listPublishedTloraPosts(studio.id) : [];
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Tin tức" title="Kênh thông tin TLORA" description="Các bài viết đã được duyệt và xuất bản từ TLORA First-party CMS." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 transition hover:border-[#d8b766]/40">
            {post.coverImageUrl && <div className="aspect-video bg-white/5" style={{ backgroundImage: `url(${post.coverImageUrl})`, backgroundPosition: "center", backgroundSize: "cover" }} />}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8b766]">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN") : "TLORA"}</p>
              <h2 className="mt-3 text-xl font-bold text-white">{post.title}</h2>
              {post.excerpt && <p className="mt-3 text-sm leading-6 text-zinc-400">{post.excerpt}</p>}
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d8b766]">Đọc bài viết <ArrowRight size={15} /></span>
            </div>
          </Link>
        ))}
        {!posts.length && <p className="text-sm text-zinc-400">Chưa có bài viết TLORA nào được xuất bản.</p>}
      </div>
    </section>
  );
}
