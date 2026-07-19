import { ArrowDown, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeCinematic } from "@/components/public/home-cinematic";
import { tlEcosystemBranches, tlLogoPlaceholder } from "@/lib/tl-ecosystem";
import { buildTloraPageMetadata } from "@/lib/tlora-metadata";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("services");
  return buildTloraPageMetadata(meta, "/dich-vu", {
    title: "Hệ sinh thái TL | Media, Studio & Academy",
    description: "TL Media, TLORA Studio và TL Academy — sản xuất hình ảnh, sáng tạo concept và đào tạo nhiếp ảnh.",
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
      <HomeCinematic />

      <section className="relative flex min-h-[72svh] items-end overflow-hidden px-5 pb-14 pt-24 sm:min-h-[78svh] sm:px-8 sm:pb-20 lg:px-10">
        <div className="absolute inset-0 grid grid-cols-3" aria-hidden="true">
          {tlEcosystemBranches.map((branch, index) => (
            <div key={branch.name} className="relative overflow-hidden border-r border-white/10 last:border-r-0">
              <Image src={image(`ecosystemPage.branch.${index}.image`, branch.image)} alt="" fill priority={index === 1} sizes="33vw" className="tl-ecosystem-hero-image object-cover" style={{ objectPosition: branch.imagePosition, animationDelay: `${index * -2.5}s` }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[#07080a]/56" />
        <div className="absolute inset-0 bg-linear-to-t from-[#07080a] via-[#07080a]/18 to-[#07080a]/45" />
        <div aria-hidden="true" className="tl-ecosystem-scan absolute inset-0" />

        <div className="relative mx-auto w-full max-w-7xl">
          <p data-cms-section="services" data-cms-field="text.ecosystemPage.eyebrow" className="home-eyebrow uppercase">
            {text("ecosystemPage.eyebrow", "TL CREATIVE GROUP")}
          </p>
          <h1 data-cms-section="services" data-cms-field="text.ecosystemPage.title" className="home-editorial-title mt-4 max-w-[9ch] text-[clamp(3.5rem,15vw,9rem)] uppercase leading-[.9]">
            {text("ecosystemPage.title", "Hệ sinh thái TL")}
          </h1>
          <div className="mt-8 flex items-center justify-between gap-5 border-t border-white/20 pt-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/65 sm:text-sm">Media · Studio · Academy</p>
            <a href="#thuong-hieu" aria-label="Xem các thương hiệu" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25 text-[var(--home-accent-gold-light)] backdrop-blur-md">
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="thuong-hieu" className="px-4 py-12 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {tlEcosystemBranches.map((branch, branchIndex) => {
            const branchImage = image(`ecosystemPage.branch.${branchIndex}.image`, branch.image);
            const branchLogo = image(`ecosystemPage.branch.${branchIndex}.logo`, tlLogoPlaceholder);
            return (
              <article key={branch.name} data-reveal data-reveal-delay={String(branchIndex * 110)} className="tl-ecosystem-panel group relative min-h-[68svh] overflow-hidden rounded-xl border border-white/10 bg-[var(--home-background-secondary)] lg:min-h-[680px]">
                <Image
                  data-cms-section="services"
                  data-cms-field={`images.ecosystemPage.branch.${branchIndex}.image`}
                  data-cms-image-url={branchImage}
                  src={branchImage}
                  alt={branch.name}
                  fill
                  sizes="(min-width: 1024px) 31vw, 94vw"
                  quality={74}
                  className="tl-ecosystem-panel-image object-cover"
                  style={{ objectPosition: branch.imagePosition }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#07080a] via-[#07080a]/25 to-[#07080a]/10" />
                <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent" />
                <div className="tl-ecosystem-shine absolute inset-0" aria-hidden="true" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-5 p-5 sm:p-6">
                  <div className="tl-ecosystem-logo relative h-14 w-36 overflow-hidden rounded-md border border-white/15 bg-black/35 p-2 backdrop-blur-xl sm:h-16 sm:w-40">
                    <Image
                      data-cms-section="services"
                      data-cms-field={`images.ecosystemPage.branch.${branchIndex}.logo`}
                      data-cms-image-url={branchLogo}
                      src={branchLogo}
                      alt={`Logo ${branch.name}`}
                      fill
                      sizes="160px"
                      className="object-contain p-2"
                    />
                  </div>
                  <span className="text-xs font-black tracking-[.18em] text-white/70">0{branchIndex + 1}</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.label`} className="home-eyebrow uppercase">
                    {text(`ecosystemPage.branch.${branchIndex}.label`, branch.label)}
                  </p>
                  <h2 data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.name`} className="home-editorial-title mt-3 text-[clamp(2.5rem,12vw,4.5rem)] uppercase leading-none">
                    {text(`ecosystemPage.branch.${branchIndex}.name`, branch.name)}
                  </h2>
                  <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.description`} className="mt-4 line-clamp-2 max-w-sm text-sm leading-6 text-white/70">
                    {text(`ecosystemPage.branch.${branchIndex}.description`, branch.description)}
                  </p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {branch.services.map((service, serviceIndex) => (
                      <li key={service} data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${branchIndex}.service.${serviceIndex}`} className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-white/85 backdrop-blur-md">
                        {text(`ecosystemPage.branch.${branchIndex}.service.${serviceIndex}`, service)}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <h2 data-cms-section="services" data-cms-field="text.ecosystemPage.ctaTitle" className="home-editorial-title max-w-[12ch] text-3xl uppercase leading-tight sm:text-5xl">
            {text("ecosystemPage.ctaTitle", "Chọn lĩnh vực. Bắt đầu dự án.")}
          </h2>
          <Link href="/bang-gia" className="home-button-primary shrink-0 px-7">
            Tư vấn <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
