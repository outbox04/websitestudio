import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { posts } from "@/lib/site-data";

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  return {
    title: post?.title || "Bài viết",
    description: post?.excerpt,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">{post.category}</p>
      <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">{post.title}</h1>
      <p className="mt-5 text-lg leading-8 text-zinc-600">{post.excerpt}</p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <button className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2"><ThumbsUp size={16} /> {post.likes} Like</button>
        <button className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2"><MessageCircle size={16} /> {post.comments} Comment</button>
        <button className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2"><Share2 size={16} /> Share</button>
      </div>
      <div className="prose prose-zinc mt-10 max-w-none">
        <p>
          Bài viết mẫu này mô phỏng trang tin tức có tối ưu SEO, social action và comment. Khi nối Supabase,
          nội dung nên lấy từ bảng `posts`, lượt thích từ `post_likes`, bình luận từ `post_comments`.
        </p>
        <p>
          Với studio ảnh, mỗi bài nên có ảnh cover tối ưu kích thước, tiêu đề rõ ý định tìm kiếm và CTA đặt lịch hoặc mở AI concept preview.
        </p>
      </div>
    </article>
  );
}
