import { NextResponse } from "next/server";
import { tloraApiError } from "@/app/api/admin/tlora/_shared";
import { requireTloraAdmin } from "@/lib/tenancy/request-context";
import { archiveTloraPost, listTloraPosts, publishTloraPost, saveTloraPost } from "@/repositories/tlora/posts-repository";
import { cmsPostSchema, publishPostSchema } from "@/schemas/tlora-cms";

export async function GET(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    return NextResponse.json({ posts: await listTloraPosts(context.studio.id) });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = cmsPostSchema.parse(await request.json());
    const post = await saveTloraPost({ ...input, studioId: context.studio.id, userId: context.userId! });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = cmsPostSchema.required({ id: true }).parse(await request.json());
    const post = await saveTloraPost({ ...input, studioId: context.studio.id, userId: context.userId! });
    return NextResponse.json({ post });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const input = publishPostSchema.parse(await request.json());
    const post = await publishTloraPost(context.studio.id, context.userId!, input.postId, input.changeNote);
    return NextResponse.json({ post });
  } catch (error) {
    return tloraApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireTloraAdmin(request);
    const postId = new URL(request.url).searchParams.get("id");
    if (!postId) return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    await archiveTloraPost(context.studio.id, context.userId!, postId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return tloraApiError(error);
  }
}

