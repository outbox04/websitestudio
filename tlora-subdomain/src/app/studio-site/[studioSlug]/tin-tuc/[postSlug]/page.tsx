import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ studioSlug: string; postSlug: string }> }): Promise<Metadata> {
  const { studioSlug, postSlug } = await params;
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("id,display_name").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) return {};
  const { data: post } = await admin.from("posts").select("title,excerpt,cover_image_url,keywords").eq("studio_id", studio.id).eq("slug", postSlug).eq("published", true).maybeSingle();
  if (!post) return {};
  return { title: post.title, description: post.excerpt || undefined, keywords: post.keywords?.split(",").map((value: string) => value.trim()).filter(Boolean), openGraph: { title: post.title, description: post.excerpt || undefined, type: "article", siteName: studio.display_name, images: post.cover_image_url ? [{ url: post.cover_image_url, width: 1200, height: 630 }] : undefined } };
}

export default async function StudioPostPage({ params }: { params: Promise<{ studioSlug: string; postSlug: string }> }) {
  const { studioSlug, postSlug } = await params;
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("id").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) notFound();
  const { data: post } = await admin.from("posts").select("title,excerpt,content,cover_image_url,created_at").eq("studio_id", studio.id).eq("slug", postSlug).eq("published", true).maybeSingle();
  if (!post) notFound();
  return <article className="min-h-screen bg-[#14110f] px-6 py-16 text-[#f4ece0]"><div className="mx-auto max-w-3xl"><p className="text-sm text-[#c99a5e]">{new Date(post.created_at).toLocaleDateString("vi-VN")}</p><h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{post.title}</h1>{post.excerpt && <p className="mt-5 text-lg leading-8 text-[#cbc0b0]">{post.excerpt}</p>}{post.cover_image_url && <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl"><Image src={post.cover_image_url} alt="" fill className="object-cover" unoptimized /></div>}<div className="news-article mt-10 leading-8 text-[#f4ece0]" dangerouslySetInnerHTML={{ __html: post.content || "" }} /></div></article>;
}
