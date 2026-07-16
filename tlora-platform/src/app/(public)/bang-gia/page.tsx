import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { pricing } from "@/lib/site-data";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("pricing");
  const title = meta.title || "Bảng giá chụp ảnh concept";
  const description = meta.description || "Chọn gói chụp phù hợp với số concept, thời lượng và số ảnh mong muốn.";
  return { title, description, openGraph: { title, description, images: meta.ogImageUrl ? [meta.ogImageUrl] : ["/brand/tlora-logo.png"] } };
}

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const content = await getPublishedTloraSection("home", "services");
  const text = (key: string, fallback: string) => {
    const values = content.text as Record<string, unknown> | undefined;
    return typeof values?.[key] === "string" ? String(values[key]) : fallback;
  };
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-4xl text-center"><h1 data-cms-section="services" data-cms-field="text.pricingPage.title" className="text-4xl font-black text-white md:text-6xl">{text("pricingPage.title", "Chọn gói chụp vừa đủ cho câu chuyện của bạn")}</h1><p data-cms-section="services" data-cms-field="text.pricingPage.description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">{text("pricingPage.description", "Mỗi gói đều ghi rõ số concept, thời lượng và số ảnh nhận được để bạn dễ chọn theo mong muốn và ngân sách.")}</p></header>
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
        {pricing.map((plan, index) => (
          <article key={plan.name} className={`rounded-lg border p-6 shadow-xl shadow-black/20 ${plan.highlighted ? "border-[#d8b766]/50 bg-[#d8b766] text-black" : "border-white/10 bg-white/[0.04] text-white"}`}>
            <h2 data-cms-section="services" data-cms-field={`text.pricingPage.${index}.name`} className="text-xl font-bold">{text(`pricingPage.${index}.name`, plan.name)}</h2>
            <p data-cms-section="services" data-cms-field={`text.pricingPage.${index}.description`} className={`mt-2 text-sm leading-6 ${plan.highlighted ? "text-black/70" : "text-zinc-400"}`}>{text(`pricingPage.${index}.description`, plan.description)}</p>
            <p data-cms-section="services" data-cms-field={`text.pricingPage.${index}.price`} className="mt-6 text-3xl font-extrabold">{text(`pricingPage.${index}.price`, plan.price)}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map((feature, featureIndex) => (
                <li key={feature} className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-400" /> <span data-cms-section="services" data-cms-field={`text.pricingPage.${index}.feature.${featureIndex}`}>{text(`pricingPage.${index}.feature.${featureIndex}`, feature)}</span></li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
