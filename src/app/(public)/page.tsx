import { ArrowRight, CalendarCheck, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader, ButtonLink } from "@/components/ui";
import { posts, pricing, services } from "@/lib/site-data";

export default function HomePage() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_0.9fr] md:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">Studio chụp ảnh concept</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-zinc-950 md:text-6xl">
              Lumi Concept Studio
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Quy trình chụp ảnh concept trong studio kết hợp cổng khách hàng, album Google Drive và AI concept preview để chọn moodboard nhanh hơn.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/bang-gia">
                Xem combo <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/cong-khach-hang" className="bg-white text-zinc-950 ring-1 ring-zinc-200 hover:bg-zinc-50">
                Vào album cá nhân
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Moodboard rõ ràng", "Chọn ảnh trực tuyến", "Retouch theo ghi chú"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <CheckCircle2 size={18} className="text-emerald-600" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-md bg-zinc-100">
            <Image
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
              alt="Studio chụp ảnh concept sáng hiện đại"
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Dịch vụ"
          title="Từ buổi chụp thật đến preview AI"
          description="Các module được tách rõ để dễ mở rộng: public website, cổng khách hàng, admin dashboard và AI workflow."
        />
        <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article key={service.title} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              <service.icon className="text-rose-600" size={28} />
              <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{service.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader eyebrow="Quy trình" title="Khách chọn ảnh ít thao tác" description="Album có popup xem ảnh lớn, checkbox rõ ràng và ghi chú dưới từng ảnh." />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["1", "Đồng bộ Drive", "Admin nhập Folder ID để lấy danh sách ảnh."],
              ["2", "Khách chọn ảnh", "Tích chọn và nhập ghi chú chỉnh sửa riêng."],
              ["3", "Staff xử lý", "Cập nhật trạng thái ảnh trong dashboard."],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-md bg-stone-50 p-5">
                <span className="grid size-10 place-items-center rounded-md bg-zinc-950 text-sm font-bold text-white">{step}</span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Bảng giá" title="Combo dễ chọn, dễ nâng cấp" description="Giá và quyền lợi nên được quản lý từ Supabase để không hardcode dữ liệu vận hành." />
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
          {pricing.map((plan) => (
            <article key={plan.name} className={`rounded-md border p-6 shadow-sm ${plan.highlighted ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white"}`}>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className={`mt-2 text-sm leading-6 ${plan.highlighted ? "text-zinc-300" : "text-zinc-600"}`}>{plan.description}</p>
              <p className="mt-6 text-3xl font-extrabold">{plan.price}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-500" /> {feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Tin tức" title="Kênh thông tin thu nhỏ" description="Bài viết hỗ trợ SEO, like, comment và share để nuôi nội dung public." />
        <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/tin-tuc/${post.slug}`} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">{post.category}</p>
              <h3 className="mt-3 text-xl font-bold">{post.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{post.excerpt}</p>
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
