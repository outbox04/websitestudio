import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { posts } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Tin tức studio",
  description: "Kênh thông tin về chụp ảnh concept, studio tips và quy trình chọn ảnh, retouch.",
  openGraph: {
    title: "Tin tức studio",
    description: "Kênh thông tin về chụp ảnh concept, studio tips và quy trình chọn ảnh, retouch.",
    images: ["/brand/tlora-logo.png"],
  },
};

export default function NewsPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Tin tức" title="Kênh thông tin studio" description="Nơi đăng bài SEO, cập nhật concept mới và hướng dẫn khách chuẩn bị buổi chụp." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/tin-tuc/${post.slug}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 transition hover:border-[#d8b766]/40">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8b766]">{post.category}</p>
            <h2 className="mt-3 text-xl font-bold text-white">{post.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{post.excerpt}</p>
            <div className="mt-5 flex gap-4 text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1"><ThumbsUp size={14} /> {post.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.comments}</span>
              <span className="flex items-center gap-1"><Share2 size={14} /> Share</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
