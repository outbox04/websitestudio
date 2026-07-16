import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext } from "@/lib/studio-admin";
import { requireTloraStudioId } from "@/lib/tlora-studio";
import {
  getErrorMessage,
  invitationPublicUrl,
  invitationUpdateFromPayload,
  weddingInvitationSelect,
  type WeddingInvitationPayload,
} from "@/lib/wedding-invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InvitationRow = {
  slug: string;
  [key: string]: unknown;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAuthContext(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { context, isPlatformAdmin } = auth;
    const { id } = await params;
    const body = (await request.json()) as WeddingInvitationPayload;
    const updateData = invitationUpdateFromPayload(body);

    if (!Object.keys(updateData).length) {
      return NextResponse.json({ error: "Khong co du lieu can cap nhat." }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!context && !isPlatformAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const targetStudioId = context?.studioId || await requireTloraStudioId();
    let query = admin
      .from("wedding_invitations")
      .update(updateData)
      .eq("id", id);

    query = query.eq("studio_id", targetStudioId);

    const { data, error } = await query.select(weddingInvitationSelect).single();
    if (error) throw error;
    const invitation = data as unknown as InvitationRow;

    return NextResponse.json({
      invitation,
      publicUrl: invitationPublicUrl(request, context?.studioSlug || null, invitation.slug),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAuthContext(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { context, isPlatformAdmin } = auth;
    const { id } = await params;
    const admin = createAdminClient();

    let query = admin.from("wedding_invitations").delete().eq("id", id);
    if (!context && !isPlatformAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    query = query.eq("studio_id", context?.studioId || await requireTloraStudioId());

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
