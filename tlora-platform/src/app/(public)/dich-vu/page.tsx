import type { Metadata } from "next";
import { services } from "@/lib/site-data";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("services");
  const title = meta.title || "Dịch vụ chụp ảnh concept";
  const description = meta.description || "Khám phá các concept chân dung cá nhân, couple, gia đình và thời trang.";
  return { title, description, openGraph: { title, description, images: meta.ogImageUrl ? [meta.ogImageUrl] : ["/brand/tlora-logo.png"] } };
}

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const content = await getPublishedTloraSection("home", "services");
  const text = (key: string, fallback: string) => {
    const values = content.text as Record<string, unknown> | undefined;
    return typeof values?.[key] === "string" ? String(values[key]) : fallback;
  };
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-4xl text-center"><h1 data-cms-section="services" data-cms-field="text.servicePage.title" className="text-4xl font-black text-white md:text-6xl">{text("servicePage.title", "Chọn concept thể hiện đúng phiên bản bạn muốn lưu giữ")}</h1><p data-cms-section="services" data-cms-field="text.servicePage.description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">{text("servicePage.description", "Từ chân dung cá nhân, couple, gia đình đến thời trang, mỗi buổi chụp đều được chuẩn bị theo phong cách và mục đích riêng của bạn.")}</p></header>
      <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2">
        {services.map((service, index) => (
          <article key={service.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20">
            <service.icon className="text-[#d8b766]" size={30} />
            <h2 data-cms-section="services" data-cms-field={`text.servicePage.${index}.title`} className="mt-5 text-2xl font-bold text-white">{text(`servicePage.${index}.title`, service.title)}</h2>
            <p data-cms-section="services" data-cms-field={`text.servicePage.${index}.description`} className="mt-3 leading-7 text-zinc-400">{text(`servicePage.${index}.description`, service.description)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
