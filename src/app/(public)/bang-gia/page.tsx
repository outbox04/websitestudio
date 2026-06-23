import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { pricing } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Bảng giá chụp ảnh concept",
  description: "Combo chụp ảnh concept cá nhân, couple, gia đình, lookbook và editorial.",
  openGraph: {
    title: "Bảng giá chụp ảnh concept",
    description: "Combo chụp ảnh concept cá nhân, couple, gia đình, lookbook và editorial.",
    images: ["/brand/tlora-logo.png"],
  },
};

export default function PricingPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Bảng giá" title="Combo chụp ảnh concept" description="Các gói minh bạch quyền lợi, dễ chọn và dễ nâng cấp theo nhu cầu sản xuất." />
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
        {pricing.map((plan) => (
          <article key={plan.name} className={`rounded-lg border p-6 shadow-xl shadow-black/20 ${plan.highlighted ? "border-[#d8b766]/50 bg-[#d8b766] text-black" : "border-white/10 bg-white/[0.04] text-white"}`}>
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className={`mt-2 text-sm leading-6 ${plan.highlighted ? "text-black/70" : "text-zinc-400"}`}>{plan.description}</p>
            <p className="mt-6 text-3xl font-extrabold">{plan.price}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-400" /> {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
