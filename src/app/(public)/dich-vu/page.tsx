import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui";
import { services } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Dịch vụ chụp ảnh concept",
  description: "Các gói chụp concept cá nhân, gia đình, lookbook và retouch hậu kỳ trong studio.",
  openGraph: {
    title: "Dịch vụ chụp ảnh concept",
    description: "Các gói chụp concept cá nhân, gia đình, lookbook và retouch hậu kỳ trong studio.",
    images: ["/brand/tlora-logo.png"],
  },
};

export default function ServicesPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Dịch vụ"
        title="Dịch vụ chụp ảnh concept trong studio"
        description="Thiết kế cho studio cần quy trình rõ ràng từ đặt lịch, chụp, chọn ảnh đến chỉnh sửa."
      />
      <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20">
            <service.icon className="text-[#d8b766]" size={30} />
            <h2 className="mt-5 text-2xl font-bold text-white">{service.title}</h2>
            <p className="mt-3 leading-7 text-zinc-400">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
