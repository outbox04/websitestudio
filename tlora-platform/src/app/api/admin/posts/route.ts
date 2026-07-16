import { NextResponse } from "next/server";
import { createSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext } from "@/lib/studio-admin";

export async function GET(request: Request) {
  const auth = await checkAuthContext(request);
  if (auth.errorResponse) return auth.errorResponse;
  const { isPlatformAdmin, context } = auth;

  const supabase = createAdminClient();
  let query = supabase.from("posts").select("id,title,slug,excerpt,cover_image_url,keywords,published,created_at");

  if (context) {
    query = query.eq("studio_id", context.studioId);
  } else if (isPlatformAdmin) {
    return NextResponse.json({ error: "TLORA posts moved to /api/admin/tlora/posts" }, { status: 410 });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ posts: data || [] });
}

export async function POST(request: Request) {
  const auth = await checkAuthContext(request);
  if (auth.errorResponse) return auth.errorResponse;
  const { isPlatformAdmin, context } = auth;

  const body = await request.json() as { title?: string; excerpt?: string; content?: string; keywords?: string; coverImageUrl?: string; published?: boolean };
  const title = body.title?.trim() || "";
  const slug = createSlug(title);
  if (!title || !slug) return NextResponse.json({ error: "Tiêu đề không hợp lệ." }, { status: 400 });

  const insertData: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    keywords: string | null;
    cover_image_url: string | null;
    published: boolean;
    studio_id?: string;
  } = {
    title,
    slug,
    excerpt: body.excerpt?.trim() || null,
    content: body.content?.trim() || null,
    keywords: body.keywords?.trim() || null,
    cover_image_url: body.coverImageUrl?.trim() || null,
    published: Boolean(body.published)
  };

  if (context) {
    insertData.studio_id = context.studioId;
  } else if (isPlatformAdmin) {
    return NextResponse.json({ error: "TLORA posts moved to /api/admin/tlora/posts" }, { status: 410 });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await createAdminClient()
    .from("posts")
    .insert(insertData)
    .select("id,title,slug,excerpt,cover_image_url,keywords,published,created_at")
    .single();

  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ post: data }, { status: 201 });
}
