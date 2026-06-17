import type { Metadata } from "next";
import { AiConceptStudio } from "@/components/ai-concept-studio";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AI Concept",
  description: "Tạo bản tham khảo concept 50.000đ/ảnh trước khi đặt lịch chụp chất lượng cao tại TLORA Studio.",
};

export default async function AiConceptPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; credit_balance_vnd: number | null } | null = null;
  let history: Array<{
    id: string;
    outfit_preset: string;
    background_preset: string;
    style_preset: string;
    status: string;
    result_image_url: string | null;
    created_at: string;
  }> = [];

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name,credit_balance_vnd")
      .eq("id", user.id)
      .maybeSingle();
    const { data: historyData } = await supabase
      .from("ai_requests")
      .select("id,outfit_preset,background_preset,style_preset,status,result_image_url,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    profile = profileData || null;
    history = historyData || [];
  }

  return (
    <main className="min-h-screen bg-[#07080a] text-white">
      <AiConceptStudio
        user={user ? { email: user.email || "", id: user.id } : null}
        initialBalanceVnd={profile?.credit_balance_vnd || 0}
        initialFullName={profile?.full_name || ""}
        initialHistory={history}
      />
    </main>
  );
}
