import { Aperture, ArrowRight, Clapperboard, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildTloraPageMetadata } from "@/lib/tlora-metadata";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";

const ecosystem = [
  {
    name: "TL Media",
    label: "Production / Event",
    description: "Đội ngũ hình ảnh dành cho những khoảnh khắc quy mô lớn, sự kiện và câu chuyện cần được ghi lại chân thực.",
    image: "/concept/concept-07.webp",
    imagePosition: "50% 35%",
    icon: Clapperboard,
    services: ["Kỷ yếu", "Phóng sự cưới", "Cưới truyền thống", "Event & sự kiện", "Tựu trường"],
  },
  {
    name: "TLORA Studio",
    label: "Studio / Concept",
    description: "Không gian sáng tạo hình ảnh cá nhân với concept được xây dựng theo phong cách, cá tính và mục đích riêng.",
    image: "/concept/concept-01.webp",
    imagePosition: "50% 28%",
    icon: Aperture,
    services: ["Chụp tại studio", "Concept ngoại cảnh", "Beauty portrait", "Fashion editorial", "Sinh nhật & cá nhân"],
  },
  {
    name: "TL Academy",
    label: "Education / Creative",
    description: "Nơi kinh nghiệm thực chiến được hệ thống thành những khóa học dễ ứng dụng cho người yêu nhiếp ảnh.",
    image: "/concept/concept-14.webp",
    imagePosition: "50% 24%",
    icon: GraduationCap,
    services: ["Khóa Chụp ảnh", "Khóa Chỉnh ảnh", "Ánh sáng & bố cục", "Chỉnh màu & retouch", "Quy trình hậu kỳ"],
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("services");
  return buildTloraPageMetadata(meta, "/dich-vu", {
    title: "Hệ sinh thái TL | Media, Studio & Academy",
    description: "Khám phá hệ sinh thái TL gồm TL Media, TLORA Studio và TL Academy — từ sản xuất hình ảnh đến đào tạo nhiếp ảnh.",
  });
}

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const content = await getPublishedTloraSection("home", "services");
  const textValues = content.text as Record<string, unknown> | undefined;
  const imageValues = content.images as Record<string, unknown> | undefined;
  const text = (key: string, fallback: string) => typeof textValues?.[key] === "string" ? String(textValues[key]) : fallback;
  const image = (key: string, fallback: string) => typeof imageValues?.[key] === "string" && imageValues[key] ? String(imageValues[key]) : fallback;

  return (
    <div className="home-luxury overflow-hidden">
      <section className="relative border-b border-white/10 px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28 lg:px-10 lg:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-0 select-none text-[clamp(12rem,32vw,31rem)] font-black leading-none tracking-[-.1em] text-white/[.025]">TL</div>
        <div className="relative mx-auto max-w-7xl">
          <p data-cms-section="services" data-cms-field="text.ecosystemPage.eyebrow" className="home-eyebrow">
            {text("ecosystemPage.eyebrow", "TL GROUP CREATIVE ECOSYSTEM")}
          </p>
          <h1 data-cms-section="services" data-cms-field="text.ecosystemPage.title" className="home-editorial-title mt-5 max-w-[13ch] text-[clamp(3rem,11vw,7rem)] leading-[1.02]">
            {text("ecosystemPage.title", "Một hệ sinh thái. Ba hướng phát triển hình ảnh.")}
          </h1>
          <div className="mt-8 grid gap-8 border-t border-white/10 pt-7 lg:grid-cols-[1fr_1fr] lg:items-end">
            <p data-cms-section="services" data-cms-field="text.ecosystemPage.description" className="max-w-2xl text-base leading-8 text-[var(--home-text-secondary)] sm:text-lg">
              {text("ecosystemPage.description", "Từ sản xuất hình ảnh quy mô lớn, sáng tạo concept cá nhân đến đào tạo kỹ năng nhiếp ảnh — mỗi thương hiệu trong TL đều có một chuyên môn riêng và cùng chia sẻ một tiêu chuẩn chất lượng.")}
            </p>
            <div className="grid grid-cols-3 gap-3 text-right">
              {["Media", "Studio", "Academy"].map((item, index) => (
                <div key={item} className="border-l border-white/10 pl-3">
                  <span className="block text-xs font-bold text-[var(--home-accent-gold)]">0{index + 1}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[.14em] text-[var(--home-text-muted)] sm:text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-white/10 pb-5 sm:mb-14">
            <div>
              <p data-cms-section="services" data-cms-field="text.ecosystemPage.brandsEyebrow" className="home-eyebrow">
                {text("ecosystemPage.brandsEyebrow", "THREE SPECIALIZED BRANDS")}
              </p>
              <h2 data-cms-section="services" data-cms-field="text.ecosystemPage.brandsTitle" className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                {text("ecosystemPage.brandsTitle", "Chọn đúng đội ngũ cho câu chuyện của bạn")}
              </h2>
            </div>
            <span className="hidden text-sm text-[var(--home-text-muted)] sm:block">TL / 01—03</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {ecosystem.map((branch, branchIndex) => {
              const Icon = branch.icon;
              const branchImage = image(`ecosystemPage.branch.${branchIndex}.image`, branch.image);
              return (
                <article key={branch.name} className="group overflow-hidden rounded-xl border border-white/10 bg-[var(--home-background-secondary)] transition duration-500 hover:-translate-y-1 hover:border-[var(--home-border-subtle)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--home-background-elevated)]">
                    <Image
                      data-cms-section="services"
                      data-cms-field={`images.ecosystemPage.branch.${branchIndex}.image`}
                      data-cms-image-url={branchImage}
                      src={branchImage}
                      alt={`${branch.name} — ${branch.label}`}
                      fill
                      sizes="(min-width: 1024px) 31vw, 92vw"
                      quality={72}
                      className="object-cover saturate-[.78] transition duration-700 group-hover:scale-[1.025] group-hover:saturate-100"
                      style={{ objectPosition: branch.imagePosition }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#08090b] via-[#08090b]/18 to-transparent" />
                    <span className="absolute left-5 top-5 grid size-11 place-items-center rounded-full border border-white/15 bg-black/35 text-[var(--home-accent-gold-light)] backdrop-blur-md">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="absolute right-5 top-5 text-xs font-bold tracking-[.14em] text-white/70">0{branchIndex + 1}</span>
                  </div>

                  <div className="p-6 sm:p-7">
                    <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.label`} className="home-eyebrow">
                      {text(`ecosystemPage.branch.${branchIndex}.label`, branch.label)}
                    </p>
                    <h3 data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.name`} className="mt-3 text-3xl font-black tracking-[-.04em] text-white">
                      {text(`ecosystemPage.branch.${branchIndex}.name`, branch.name)}
                    </h3>
                    <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.description`} className="mt-4 min-h-24 text-sm leading-7 text-[var(--home-text-secondary)]">
                      {text(`ecosystemPage.branch.${branchIndex}.description`, branch.description)}
                    </p>
                    <ul className="mt-6 border-t border-white/10 pt-3">
                      {branch.services.map((service, serviceIndex) => (
                        <li key={service} className="flex items-center justify-between gap-3 border-b border-white/[.07] py-3 text-sm text-[var(--home-text-primary)] last:border-b-0">
                          <span data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.service.${serviceIndex}`}>
                            {text(`ecosystemPage.branch.${branchIndex}.service.${serviceIndex}`, service)}
                          </span>
                          <i aria-hidden="true" className="size-1 shrink-0 bg-[var(--home-accent-gold)]" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[var(--home-background-secondary)] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p data-cms-section="services" data-cms-field="text.ecosystemPage.ctaEyebrow" className="home-eyebrow">
              {text("ecosystemPage.ctaEyebrow", "START YOUR STORY")}
            </p>
            <h2 data-cms-section="services" data-cms-field="text.ecosystemPage.ctaTitle" className="home-editorial-title mt-4 max-w-[16ch] text-3xl leading-tight sm:text-5xl">
              {text("ecosystemPage.ctaTitle", "Bạn đang cần hình ảnh, một concept hay một khóa học?")}
            </h2>
          </div>
          <Link href="/bang-gia" className="home-button-primary shrink-0 px-7">
            Nhận tư vấn phù hợp <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
