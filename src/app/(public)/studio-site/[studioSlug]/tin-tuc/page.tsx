import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function StudioNewsPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("id,display_name").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) notFound();
  const { data: posts } = await admin.from("posts").select("title,slug,excerpt,created_at").eq("studio_id", studio.id).eq("published", true).order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#14110f] px-6 py-16 text-[#f4ece0]"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#c99a5e]">{studio.display_name}</p><h1 className="mt-3 text-4xl font-extrabold">Tin tức</h1><div className="mt-10 grid gap-4">{(posts || []).map(post => <Link key={post.slug} href={`/tin-tuc/${post.slug}`} className="rounded-2xl border border-white/10 bg-white/[.04] p-6 transition hover:border-[#c99a5e]/50"><h2 className="text-xl font-bold">{post.title}</h2>{post.excerpt && <p className="mt-3 leading-7 text-[#cbc0b0]">{post.excerpt}</p>}</Link>)}{!posts?.length && <p className="text-[#cbc0b0]">Chưa có bài viết nào.</p>}</div></div></main>;
}
