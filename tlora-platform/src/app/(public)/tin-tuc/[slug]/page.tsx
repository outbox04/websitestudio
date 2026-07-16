import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFirstPartyStudio } from "@/lib/tenancy/request-context";
import { getPublishedTloraPost } from "@/repositories/tlora/posts-repository";

async function findPost(slug: string) {
  const studio = await getFirstPartyStudio();
  return studio ? getPublishedTloraPost(studio.id, slug) : null;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);
  const title = post?.title || "Bài viết TLORA";
  const description = post?.excerpt || "Gợi ý và cảm hứng giúp bạn chuẩn bị tốt hơn cho bộ ảnh concept của mình.";
  return {
    title,
    description,
    keywords: post?.keywords,
    openGraph: { title, description, images: post?.coverImageUrl ? [post.coverImageUrl] : ["/brand/tlora-logo.png"] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN") : "TLORA Studio"}</p>
      <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">{post.title}</h1>
      {post.excerpt && <p className="mt-5 text-lg leading-8 text-zinc-400">{post.excerpt}</p>}
      {post.coverImageUrl && <div className="mt-8 aspect-video rounded-xl bg-zinc-900" style={{ backgroundImage: `url(${post.coverImageUrl})`, backgroundPosition: "center", backgroundSize: "cover" }} />}
      <div className="mt-10 space-y-5 text-base leading-8 text-zinc-300">
        {post.body.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
      </div>
    </article>
  );
}
