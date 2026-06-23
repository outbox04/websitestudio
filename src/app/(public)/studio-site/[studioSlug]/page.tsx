import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type Studio = {
  display_name: string;
  primary_domain: string | null;
  plan: string;
  status: string;
};

async function getStudio(studioSlug: string): Promise<Studio | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("studios")
    .select("display_name, primary_domain, plan, status")
    .eq("slug", studioSlug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ studioSlug: string }> }): Promise<Metadata> {
  const { studioSlug } = await params;
  try {
    const studio = await getStudio(studioSlug);
    if (!studio) return { title: "Studio" };
    return { title: studio.display_name, description: `Website chính thức của ${studio.display_name}.` };
  } catch {
    return { title: "Studio" };
  }
}

export default async function StudioHomePage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  let studio: Studio | null = null;
  try {
    studio = await getStudio(studioSlug);
  } catch {
    notFound();
  }

  if (!studio || studio.status !== "active") notFound();

  return (
    <main className="grid min-h-screen place-items-center bg-[#14110f] px-6 py-16 text-[#f4ece0]">
      <section className="w-full max-w-2xl rounded-[2rem] border border-[#c99a5e]/25 bg-[#1c1813] p-8 text-center shadow-2xl shadow-black/30 sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#c99a5e]">TLORA Studio</p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{studio.display_name}</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#cbc0b0]">Website studio đang được hoàn thiện. Hãy quay lại sớm để khám phá portfolio và các dịch vụ của chúng tôi.</p>
        <div className="mt-9 border-t border-white/10 pt-6 text-sm text-[#8c8174]">{studio.primary_domain || `${studioSlug}.tlgroup.site`}</div>
      </section>
    </main>
  );
}
