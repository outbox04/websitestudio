import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui";
import { services } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Dịch vụ chụp ảnh concept",
  description: "Các gói chụp concept cá nhân, gia đình, lookbook và AI preview trong studio.",
};

export default function ServicesPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Dịch vụ" title="Dịch vụ chụp ảnh concept trong studio" description="Thiết kế cho studio cần quy trình rõ ràng từ đặt lịch, chụp, chọn ảnh đến chỉnh sửa." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <service.icon className="text-rose-600" size={30} />
            <h2 className="mt-5 text-2xl font-bold">{service.title}</h2>
            <p className="mt-3 leading-7 text-zinc-600">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
