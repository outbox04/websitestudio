import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthContext } from "@/lib/studio-admin";
import {
  createUniqueInvitationSlug,
  getErrorMessage,
  invitationInsertFromPayload,
  invitationPublicUrl,
  weddingInvitationSelect,
  type WeddingInvitationPayload,
} from "@/lib/wedding-invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InvitationListRow = {
  slug: string;
  studios?: { slug?: string | null } | null;
  [key: string]: unknown;
};

export async function GET(request: Request) {
  try {
    const auth = await checkAuthContext(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { context } = auth;
    if (!context) return NextResponse.json({ error: "Tenant studio context required" }, { status: 403 });
    const admin = createAdminClient();

    let query = admin
      .from("wedding_invitations")
      .select(`${weddingInvitationSelect},studios(slug)`)
      .order("created_at", { ascending: false });

    query = query.eq("studio_id", context.studioId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      invitations: ((data || []) as unknown as InvitationListRow[]).map((invitation) => {
        const studioSlug = context?.studioSlug || invitation.studios?.slug || null;
        return {
          ...invitation,
          publicUrl: invitationPublicUrl(request, studioSlug, invitation.slug),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAuthContext(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { context, isPlatformAdmin } = auth;

    if (!context?.studioId) return NextResponse.json({ error: isPlatformAdmin ? "First-party invitations are managed by the platform application." : "Forbidden" }, { status: 403 });

    const body = (await request.json()) as WeddingInvitationPayload;
    const admin = createAdminClient();
    const studioId = context.studioId;
    const insertData = invitationInsertFromPayload(body, studioId, context.userId);
    const slug = await createUniqueInvitationSlug(admin, studioId, body);

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
        publicUrl: invitationPublicUrl(request, context.studioSlug || null, slug),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
