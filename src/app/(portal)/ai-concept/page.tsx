import type { Metadata } from "next";
import { AiWizard } from "@/components/ai-wizard";

export const metadata: Metadata = {
  title: "AI Concept Generator",
  description: "Upload ảnh rõ mặt, chọn trang phục, background, phong cách và tạo ảnh AI.",
};

export default function AiConceptPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">AI Concept Generator</p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">Tạo concept ảnh AI theo từng bước</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Workflow lưu prompt, rule, preset trang phục, background và lịch sử ảnh đã tạo.</p>
      </div>
      <AiWizard />
    </main>
  );
}
