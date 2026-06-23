import { NextResponse } from "next/server";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioAdminContext, studioSlugFromHost } from "@/lib/studio-admin";

async function contextFor(request: Request) {
  const slug = studioSlugFromHost(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  return slug ? getStudioAdminContext(slug) : null;
}

export async function GET(request: Request) {
  const context = await contextFor(request);
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await createAdminClient().from("posts").select("id,title,slug,excerpt,published,created_at").eq("studio_id", context.studioId).order("created_at", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ posts: data || [] });
}

export async function POST(request: Request) {
  const context = await contextFor(request);
  if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { title?: string; excerpt?: string; content?: string; published?: boolean };
  const title = body.title?.trim() || "";
  const slug = createSlug(title);
  if (!title || !slug) return NextResponse.json({ error: "Tiêu đề không hợp lệ." }, { status: 400 });
  const { data, error } = await createAdminClient().from("posts").insert({ studio_id: context.studioId, title, slug, excerpt: body.excerpt?.trim() || null, content: body.content?.trim() || null, published: Boolean(body.published) }).select("id,title,slug,excerpt,published,created_at").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ post: data }, { status: 201 });
}
