import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WeddingInvitationBuilder } from "@/components/wedding-invitation-builder";
import { createAdminClient } from "@/lib/supabase/admin";

type Studio = {
  display_name: string;
  status: string;
};

export const dynamic = "force-dynamic";
const WEDDING_FEATURE_SLUG = "wedding";
const WEDDING_FEATURE_NAME = "Wedding Studio";

async function getStudio(studioSlug: string): Promise<Studio | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("studios")
    .select("display_name,status")
    .eq("slug", studioSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ studioSlug: string }> }): Promise<Metadata> {
  const { studioSlug } = await params;
  try {
    const studio = await getStudio(studioSlug);
    return {
      title: studio ? `Tao thiep cuoi - ${studio.display_name}` : "Tao thiep cuoi",
      description: "Form tao thiep cuoi online voi preview truc tiep cho studio wedding.",
    };
  } catch {
    return { title: "Tao thiep cuoi" };
  }
}

export default async function WeddingInvitationPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  let studio: Studio | null = null;
  try {
    studio = await getStudio(studioSlug);
  } catch {
    if (studioSlug !== WEDDING_FEATURE_SLUG) notFound();
  }

  if (!studio && studioSlug !== WEDDING_FEATURE_SLUG) notFound();

  return <WeddingInvitationBuilder studioName={studio?.display_name || WEDDING_FEATURE_NAME} studioSlug={studioSlug} />;
}
