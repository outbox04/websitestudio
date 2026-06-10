import { ArrowRight, CalendarCheck, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader, ButtonLink } from "@/components/ui";
import { posts, pricing, services } from "@/lib/site-data";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <Image
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85"
          alt="Biệt thự hiện đại được chụp vào buổi tối"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-[#07080a]/75 to-[#07080a]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-transparent to-transparent" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-end px-4 pb-14 pt-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Studio chụp ảnh concept</p>
            <h1 className="mt-4 font-heading text-5xl font-extrabold leading-tight text-white md:text-7xl">Lumi Concept Studio</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Trải nghiệm chụp ảnh, chọn album và gửi yêu cầu chỉnh sửa trong một giao diện cao cấp, trực quan và đồng bộ với workflow studio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/bang-gia">
                Xem combo <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/cong-khach-hang" className="border border-white/10 bg-white/[0.06] text-white shadow-none hover:bg-white/10">
                Vào album cá nhân
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Moodboard rõ ràng", "Chọn ảnh trực tuyến", "Retouch theo ghi chú"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <CheckCircle2 size={18} className="text-[#d8b766]" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Dịch vụ"
          title="Từ buổi chụp thật đến preview AI"
          description="Các module được thiết kế cho studio cần quy trình rõ ràng: public website, cổng khách hàng, admin dashboard và AI workflow."
        />
        <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article key={service.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
              <service.icon className="text-[#d8b766]" size={28} />
              <h3 className="mt-5 text-lg font-bold text-white">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeader eyebrow="Quy trình" title="Khách chọn ảnh ít thao tác" description="Album có xem ảnh lớn, checkbox rõ ràng, ghi chú từng ảnh và thanh hành động nổi cho ảnh đã chọn." />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["1", "Đồng bộ Drive", "Admin nhập Folder ID để lấy danh sách ảnh."],
              ["2", "Khách chọn ảnh", "Tích chọn và nhập ghi chú chỉnh sửa riêng."],
              ["3", "Staff xử lý", "Cập nhật trạng thái ảnh trong dashboard."],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-lg border border-white/10 bg-[#101115] p-5">
                <span className="grid size-10 place-items-center rounded-md bg-[#d8b766] text-sm font-bold text-black">{step}</span>
                <h3 className="mt-4 font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Bảng giá" title="Combo dễ chọn, dễ nâng cấp" description="Các gói được trình bày rõ quyền lợi để khách dễ quyết định trước buổi chụp." />
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
          {pricing.map((plan) => (
            <article key={plan.name} className={`rounded-lg border p-6 shadow-xl shadow-black/20 ${plan.highlighted ? "border-[#d8b766]/50 bg-[#d8b766] text-black" : "border-white/10 bg-white/[0.04] text-white"}`}>
              <h3 className="text-xl font-bold">{plan.name}</h3>
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

      <section className="border-t border-white/10 bg-white/[0.03] px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Tin tức" title="Kênh thông tin studio" description="Bài viết hỗ trợ SEO, hướng dẫn chuẩn bị buổi chụp và chia sẻ workflow studio." />
        <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/tin-tuc/${post.slug}`} className="rounded-lg border border-white/10 bg-[#101115] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#d8b766]/40">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8b766]">{post.category}</p>
              <h3 className="mt-3 text-xl font-bold text-white">{post.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{post.excerpt}</p>
              <div className="mt-5 flex items-center gap-4 text-xs font-medium text-zinc-500">
                <span className="flex items-center gap-1"><CalendarCheck size={14} /> {post.readTime}</span>
                <span className="flex items-center gap-1"><ImageIcon size={14} /> {post.likes} like</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
