import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStudioRequest } from "@/lib/tenancy/request-context";
import {
  createUniqueInvitationSlug,
  getErrorMessage,
  getRequestStudioSlug,
  invitationInsertFromPayload,
  invitationPublicUrl,
  resolveStudio,
  weddingInvitationSelect,
  type WeddingInvitationPayload,
} from "@/lib/wedding-invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || "";
    const studioSlug = url.searchParams.get("studioSlug")?.trim() || getRequestStudioSlug(request);

    if (!slug) {
      return NextResponse.json({ error: "Thieu slug thiep cuoi." }, { status: 400 });
    }

    const admin = createAdminClient();
    const studio = await resolveStudio(admin, studioSlug);
    let query = admin
      .from("wedding_invitations")
      .select(weddingInvitationSelect)
      .eq("slug", slug)
      .eq("status", "published");

    query = query.eq("studio_id", studio.id);
    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Khong tim thay thiep cuoi." }, { status: 404 });

    return NextResponse.json({
      invitation: data,
      publicUrl: invitationPublicUrl(request, studio?.slug || studioSlug || null, slug),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await resolveStudioRequest(request);
    if (!context.userId || !context.studio || !["owner", "admin"].includes(context.role || "")) {
      return NextResponse.json({ error: "Studio owner or admin required." }, { status: 403 });
    }
    const body = (await request.json()) as WeddingInvitationPayload;
    const admin = createAdminClient();
    const studio = { id: context.studio.id, slug: context.studio.slug };
    const insertData = invitationInsertFromPayload(body, studio.id);
    const slug = await createUniqueInvitationSlug(admin, studio.id, body);

    if (!insertData.groom_name || !insertData.bride_name) {
      return NextResponse.json({ error: "Ten co dau va chu re la bat buoc." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("wedding_invitations")
      .insert({ ...insertData, slug })
      .select(weddingInvitationSelect)
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        invitation: data,
        publicUrl: invitationPublicUrl(request, studio.slug, slug),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
