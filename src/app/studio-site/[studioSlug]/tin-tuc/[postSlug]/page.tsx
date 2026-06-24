import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function StudioPostPage({ params }: { params: Promise<{ studioSlug: string; postSlug: string }> }) {
  const { studioSlug, postSlug } = await params;
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("id").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) notFound();
  const { data: post } = await admin.from("posts").select("title,excerpt,content,created_at").eq("studio_id", studio.id).eq("slug", postSlug).eq("published", true).maybeSingle();
  if (!post) notFound();
  return <article className="min-h-screen bg-[#14110f] px-6 py-16 text-[#f4ece0]"><div className="mx-auto max-w-3xl"><h1 className="text-4xl font-extrabold leading-tight">{post.title}</h1>{post.excerpt && <p className="mt-5 text-lg leading-8 text-[#cbc0b0]">{post.excerpt}</p>}<div className="mt-10 whitespace-pre-wrap leading-8 text-[#f4ece0]">{post.content}</div></div></article>;
}
