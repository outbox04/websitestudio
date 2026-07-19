import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ConceptAlbumCard } from "@/components/public/concept-album-card";
import { HeroBannerSlideshow } from "@/components/public/hero-banner-slideshow";
import { HomeStickyCta } from "@/components/public/home-sticky-cta";
import { MobileCarousel } from "@/components/public/mobile-carousel";
import { createAdminClient } from "@/lib/supabase/admin";
import { tloraPublicCacheTags } from "@/lib/tlora-public-cache";
import { buildTloraPageMetadata } from "@/lib/tlora-metadata";
import { listPublishedTloraConceptAlbums } from "@/repositories/tlora/concept-albums-repository";
import type { TloraConceptAlbum } from "@/types/scope";
import { HomeCinematic } from "@/components/public/home-cinematic";

const trustItems = [
  "Tư vấn concept trước khi chụp",
  "Chọn ảnh online trong 48h",
  "Hậu kỳ kiểm soát từng file",
];

const services = [
  {
    id: "sinh-nhat",
    index: "01",
    label: "SINH NHẬT",
    title: "Một buổi chụp sinh nhật không chỉ là thổi nến",
    description:
      "TLORA dựng concept theo đúng tính cách và cột mốc tuổi của bạn. Màu sắc, set trang trí và trang phục đều kể một câu chuyện, không phải đứng cạnh phông nền có sẵn.",
    who: "Dành cho ai đang đánh dấu một tuổi mới, một mốc quan trọng, muốn lưu lại bằng ảnh thay vì chỉ video ngắn.",
    mood: "MOOD - Pop màu, tuổi mới",
    image: "/concept/concept-01.webp",
    accent: "#E8704F",
    soft: "rgba(232,112,79,0.14)",
    chips: ["18 / 22 / 30 tuổi", "Cá nhân hoặc gia đình"],
    features: [
      "Tư vấn theme và bảng màu riêng theo cá tính",
      "Set trang trí dựng theo tuổi hoặc chủ đề đã chọn",
      "Hướng dẫn tạo dáng tại chỗ, không cần kinh nghiệm",
    ],
    receiptName: "SINH NHẬT CONCEPT",
    items: [
      ["Tư vấn chọn theme và màu sắc riêng", "1 buổi"],
      ["Set dựng theo tuổi / chủ đề", "1 set"],
      ["Trang phục thay đổi", "2 lượt"],
      ["Photographer đồng hành tại set", "60-90 phút"],
      ["Chọn ảnh online riêng tư", "48h"],
      ["Ảnh đã retouch bàn giao", "15 ảnh"],
    ],
    value: "2.350.000đ",
    price: "1.490.000đ",
  },
  {
    id: "beauty",
    index: "02",
    label: "BEAUTY",
    title: "Một bộ ảnh để bạn thấy phiên bản đẹp nhất của mình",
    description:
      "Ánh sáng beauty chuẩn editorial, da được giữ nguyên chất nhưng sáng và mịn hơn dưới hậu kỳ tay nghề. Ảnh đẹp hơn, nhưng vẫn là bạn.",
    who: "Dành cho ai cần ảnh profile, ảnh cá nhân chỉn chu, hoặc đơn giản là muốn một lần được chụp đúng nghĩa đẹp thật.",
    mood: "MOOD - Beauty editorial",
    image: "/concept/concept-05.webp",
    accent: "#C99A5E",
    soft: "rgba(201,154,94,0.16)",
    chips: ["Profile cá nhân", "Da sáng, tự nhiên"],
    features: [
      "Tư vấn concept beauty theo gu cá nhân",
      "Hướng dẫn skincare và chuẩn bị da trước buổi chụp",
      "Retouch da tự nhiên, không làm sai khác gương mặt",
    ],
    receiptName: "BEAUTY CONCEPT",
    items: [
      ["Tư vấn concept beauty theo gu cá nhân", "1 buổi"],
      ["Hướng dẫn chuẩn bị da trước chụp", "checklist"],
      ["Set ánh sáng beauty chuẩn editorial", "1 set"],
      ["Photographer đồng hành tại set", "45-60 phút"],
      ["Chọn ảnh online riêng tư", "48h"],
      ["Ảnh retouch da tự nhiên bàn giao", "10 ảnh"],
    ],
    value: "1.980.000đ",
    price: "1.290.000đ",
  },
  {
    id: "concept",
    index: "03",
    label: "CONCEPT TRANG PHỤC",
    title: "Bước vào một câu chuyện thời trang do bạn chọn",
    description:
      "Từ business, editorial, vintage đến color-pop, mỗi mood là một bối cảnh ánh sáng riêng, không phải đổi áo rồi chụp lại cùng một góc.",
    who: "Dành cho ai cần ảnh lookbook, ảnh cá nhân để làm nội dung, hoặc muốn thử một phiên bản phong cách khác của mình.",
    mood: "MOOD - Lookbook tối giản",
    image: "/concept/concept-09.webp",
    accent: "#3E6B5E",
    soft: "rgba(62,107,94,0.18)",
    chips: ["Content / cá nhân", "2-3 set bối cảnh"],
    features: [
      "Moodboard và tư vấn phong cách trước buổi chụp",
      "2-3 set bối cảnh hoặc ánh sáng khác nhau trong một buổi",
      "Đạo diễn tạo dáng tại chỗ theo từng mood",
    ],
    receiptName: "CONCEPT TRANG PHỤC",
    items: [
      ["Moodboard và tư vấn phong cách", "1 buổi"],
      ["Set bối cảnh / ánh sáng khác nhau", "2-3 set"],
      ["Trang phục thay đổi", "2-3 lượt"],
      ["Photographer đồng hành tại set", "90-120 phút"],
      ["Chọn ảnh online riêng tư", "48h"],
      ["Ảnh retouch theo mood bàn giao", "20 ảnh"],
    ],
    value: "3.150.000đ",
    price: "1.990.000đ",
  },
];

const processSteps = [
  ["01", "Tư vấn và chọn concept", "Chọn mục tiêu hình ảnh, phong cách, trang phục và thời lượng phù hợp."],
  ["02", "Chuẩn bị set và moodboard", "TLORA lên moodboard, setup ánh sáng, makeup và đạo cụ theo concept đã chốt."],
  ["03", "Chụp tại studio", "Photographer hướng dẫn tạo dáng trực tiếp, chỉnh kịp thời tại set."],
  ["04", "Chọn ảnh online", "Khách nhận album riêng, chấm và ghi chú chỉnh sửa cho từng file."],
  ["05", "Retouch và bàn giao", "File hoàn thiện được upload vào album, khách tải về theo đúng ghi chú."],
];

const whyCards = [
  ["Tư vấn dễ hiểu", "Không dùng thuật ngữ khó hiểu, mọi lựa chọn đều gắn với mục đích sử dụng ảnh thật."],
  ["Tạo dáng tự nhiên", "Photographer hướng dẫn trực tiếp tại chỗ, không bắt khách tự dò kiểu ảnh mẫu trên mạng."],
  ["Hậu kỳ có kiểm soát", "Retouch giữ nét gương mặt thật, không làm khách cảm thấy ảnh xa lạ với chính mình."],
];

const faqs = [
  ["Tôi chưa biết chọn concept nào thì sao?", "TLORA tư vấn dựa trên mục đích dùng ảnh và tính cách của bạn trước khi chốt mood, trang phục và bối cảnh. Bạn không cần tự nghĩ ra concept từ đầu."],
  ["Buổi chụp kéo dài bao lâu?", "Tùy dịch vụ: 60-90 phút cho Sinh nhật, 45-60 phút cho Beauty, 90-120 phút cho Concept trang phục có nhiều set bối cảnh."],
  ["Tôi có thể đổi trang phục bao nhiêu lần?", "Mỗi dịch vụ có số lượt đổi trang phục cụ thể, được ghi rõ trong hóa đơn giá trị của từng concept ở trên."],
  ["Ảnh có được chỉnh sửa da tự nhiên không?", "Có. TLORA retouch giữ nét gương mặt thật, chỉ làm sáng và mịn da hợp lý, không thay đổi cấu trúc khuôn mặt."],
  ["Bao lâu thì nhận được ảnh?", "Khách chọn ảnh online trong 48h sau buổi chụp, ảnh đã retouch được bàn giao theo lịch hẹn cụ thể tại buổi tư vấn."],
];

type PublishedSection = {
  isEnabled: boolean;
  content: Record<string, unknown>;
};

function cmsText(content: Record<string, unknown>, key: string, fallback: string) {
  const values = content.text as Record<string, unknown> | undefined;
  return typeof values?.[key] === "string" ? String(values[key]) : fallback;
}

function getSectionText(cmsValue: unknown, oldDefaults: string[], newDefault: string): string {
  const str = typeof cmsValue === "string" && cmsValue.trim() ? cmsValue.trim() : "";
  if (!str || oldDefaults.includes(str)) {
    return newDefault;
  }
  return str;
}

function cmsImage(content: Record<string, unknown>, key: string, fallback: string) {
  const values = content.images as Record<string, unknown> | undefined;
  return typeof values?.[key] === "string" && values[key] ? String(values[key]) : fallback;
}

const getPublishedHome = unstable_cache(async () => {
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("id").eq("studio_type", "first_party").eq("system_key", "tlora").maybeSingle();
  if (!studio) return { page: null, sections: {} as Record<string, PublishedSection> };
  const { data: page } = await admin
    .from("tlora_cms_pages")
    .select("id,seo_title,seo_description,og_image_url")
    .eq("studio_id", studio.id)
    .eq("page_key", "home")
    .eq("status", "published")
    .maybeSingle();
  if (!page) return { page: null, sections: {} as Record<string, PublishedSection> };
  const { data: sections } = await admin
    .from("tlora_cms_page_sections")
    .select("section_key,published_content,is_enabled")
    .eq("page_id", page.id)
    .order("sort_order");

  const sectionMap = Object.fromEntries(
    (sections || []).map((section: { section_key: string; is_enabled: boolean; published_content: unknown }) => [
      section.section_key,
      { isEnabled: section.is_enabled, content: section.published_content as Record<string, unknown> },
    ])
  ) as Record<string, PublishedSection>;
  return { page, sections: sectionMap };
}, ["tlora-published-home"], {
  revalidate: 300,
  tags: [tloraPublicCacheTags.home, tloraPublicCacheTags.cms],
});

async function getPublishedHomeSafe() {
  try {
    return await getPublishedHome();
  } catch {
    return { page: null, sections: {} as Record<string, PublishedSection> };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPublishedHomeSafe();
  return buildTloraPageMetadata({ title: page?.seo_title || "", description: page?.seo_description || "", ogImageUrl: page?.og_image_url || "" }, "/", { title: "TLORA Studio", description: "TLORA Studio chụp ảnh concept cá nhân, chọn ảnh online và quản lý album riêng." });
}

export default async function HomePage() {
  const [{ sections: publishedSections }, selectedAlbums] = await Promise.all([
    getPublishedHomeSafe(),
    listPublishedTloraConceptAlbums(6).catch(() => [] as TloraConceptAlbum[]),
  ]);
  const publishedHero = publishedSections.hero?.isEnabled ? publishedSections.hero.content : {};
  const publishedAbout = publishedSections.about?.isEnabled ? publishedSections.about.content : {};
  const publishedServices = publishedSections.services?.isEnabled ? publishedSections.services.content : {};
  const publishedGallery = publishedSections.gallery?.isEnabled ? publishedSections.gallery.content : {};
  const publishedContact = publishedSections.contact?.isEnabled ? publishedSections.contact.content : {};
  const heroImagePosition = typeof publishedHero.imagePosition === "string" ? publishedHero.imagePosition : "62% 50%";
  const heroFallbackImage = String(publishedHero.image || "/concept/concept-14.webp");
  const heroSlides = Array.isArray(publishedHero.slides) ? publishedHero.slides.filter((value: unknown): value is string => typeof value === "string" && Boolean(value)) : [];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TLORA Studio",
    url: "https://tlgroup.site",
    description: "TLORA Studio chụp ảnh concept cá nhân, chọn ảnh online và quản lý album riêng.",
    inLanguage: "vi-VN",
  };

  return (
    <>
      <HomeCinematic />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div id="top" className="home-luxury">
        <section hidden={publishedSections.hero?.isEnabled === false} id="home-hero" data-cms-section-root="hero" className="relative flex min-h-svh items-end overflow-hidden px-5 pb-10 pt-28 sm:px-8 sm:pb-14 lg:px-10 lg:pb-16">
          <HeroBannerSlideshow initialSlides={heroSlides} fallbackImage={heroFallbackImage} imagePosition={heroImagePosition} />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#08090b]/58 via-transparent to-[#08090b]/92" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#08090b]/78 via-[#08090b]/22 to-transparent lg:via-transparent" />
          <div className="home-hero-copy relative mx-auto w-full max-w-7xl">
            <p data-cms-section="hero" data-cms-field="text.eyebrow" className="home-eyebrow">{cmsText(publishedHero, "eyebrow", "TLORA Portrait Studio")}</p>
            <h1 data-cms-section="hero" data-cms-field="title" className="aurora-title home-editorial-title mt-4 max-w-[10ch] text-[clamp(2.65rem,12vw,5rem)] font-extrabold leading-[1.15] text-white sm:max-w-[12ch] lg:max-w-[13ch] lg:text-[clamp(5rem,7.4vw,7rem)] lg:leading-[1.1]">
              <span className="relative z-10">{String(publishedHero.title || "Mỗi set chụp là một concept dựng riêng cho bạn.")}</span>
              <span className="aurora pointer-events-none absolute inset-0 z-20 mix-blend-darken" aria-hidden="true">
                <span className="aurora__item" />
                <span className="aurora__item" />
                <span className="aurora__item" />
                <span className="aurora__item" />
              </span>
            </h1>
            <p data-cms-section="hero" data-cms-field="description" className="mt-6 max-w-xl text-base leading-7 text-[var(--home-text-secondary)] sm:text-lg sm:leading-8">
              {String(publishedHero.description || "TLORA không chụp đại trà. Ba dịch vụ, một tiêu chuẩn duy nhất: ảnh nhận về phải xứng đáng với số tiền bạn bỏ ra.")}
            </p>
            <div className="mt-7 flex flex-col gap-3 min-[430px]:flex-row">
              <Link data-cms-section="hero" data-cms-field="ctaHref" href={String(publishedHero.ctaHref || "/bang-gia")} className="home-button-primary px-6">
                <span data-cms-section="hero" data-cms-field="ctaLabel">{String(publishedHero.ctaLabel || "Đặt lịch tư vấn")}</span><ArrowRight size={17} aria-hidden="true" />
              </Link>
              <PillLink href="#mood"><span data-cms-section="hero" data-cms-field="text.secondaryCta">{cmsText(publishedHero, "secondaryCta", "Xem mood ảnh mẫu")}</span></PillLink>
            </div>
            <ul className="mt-8 grid max-w-3xl gap-2 border-t border-white/10 pt-5 sm:grid-cols-3">
              {trustItems.map((item, index) => <li key={item} className="flex items-center gap-2 text-sm text-[var(--home-text-secondary)]"><Check size={15} className="text-[var(--home-accent-gold)]" aria-hidden="true" /><span data-cms-section="hero" data-cms-field={`text.trust.${index}`}>{cmsText(publishedHero, `trust.${index}`, item)}</span></li>)}
            </ul>
          </div>
        </section>

        <div className="w-full overflow-hidden border-y border-white/10 bg-[var(--home-background-secondary)] py-4" aria-label="Phong cách TLORA">
          <div className="home-marquee-track flex items-center text-sm font-semibold uppercase tracking-[.2em] text-[var(--home-text-secondary)]">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
                {[0, 1, 2].flatMap((repeatIndex) =>
                  ["Fashion", "Beauty", "Portrait", "Personal Story", "TLORA"].map((word, index) => (
                    <span key={`${copy}-${repeatIndex}-${word}`} className="flex items-center">
                      <i className="mx-5 size-1 not-italic bg-[var(--home-accent-gold)]" />
                      <span
                        data-cms-section={copy === 0 && repeatIndex === 0 ? "hero" : undefined}
                        data-cms-field={copy === 0 && repeatIndex === 0 ? `text.marquee.${index}` : undefined}
                      >
                        {cmsText(publishedHero, `marquee.${index}`, word)}
                      </span>
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        <div aria-hidden="true" className="home-section-divider" />
        <section hidden={publishedSections.about?.isEnabled === false} data-cms-section-root="about" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
            <div data-reveal data-reveal-delay="0" className="relative mx-auto w-full max-w-xl pb-12 pr-8 sm:pb-16 sm:pr-14">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[var(--home-background-elevated)]"><Image data-cms-section="about" data-cms-field="images.primary" data-cms-image-url={cmsImage(publishedAbout, "primary", cmsImage(publishedServices, "service.beauty", services[1].image))} src={cmsImage(publishedAbout, "primary", cmsImage(publishedServices, "service.beauty", services[1].image))} alt="Chân dung beauty editorial tại TLORA" fill sizes="(min-width: 1024px) 42vw, 90vw" quality={70} className="home-img-reveal object-cover" /></div>
              <div className="absolute bottom-0 right-0 aspect-[3/4] w-[38%] overflow-hidden rounded-[18px] border-[6px] border-[var(--home-background-primary)] bg-[var(--home-background-elevated)]"><Image data-cms-section="about" data-cms-field="images.secondary" data-cms-image-url={cmsImage(publishedAbout, "secondary", cmsImage(publishedServices, "service.concept", services[2].image))} src={cmsImage(publishedAbout, "secondary", cmsImage(publishedServices, "service.concept", services[2].image))} alt="Chi tiết concept thời trang TLORA" fill sizes="(min-width: 1024px) 16vw, 34vw" quality={70} className="object-cover" /></div>
            </div>
            <div data-reveal data-reveal-delay="120">
              <p data-cms-section="about" data-cms-field="text.eyebrow" className="home-eyebrow">{cmsText(publishedAbout, "eyebrow", "We don't just take photos")}</p>
              <h2 data-cms-section="about" data-cms-field="title" className="home-editorial-title home-shine mt-5 max-w-[15ch] text-[clamp(2.4rem,9vw,4.4rem)] leading-[1.15]">{String(publishedAbout.title || "TLORA giữ buổi chụp riêng tư, rõ ràng và tôn trọng cá tính từng người")}</h2>
              <p data-cms-section="about" data-cms-field="description" className="mt-6 max-w-xl text-base leading-8 text-[var(--home-text-secondary)]">{String(publishedAbout.description || "Trải nghiệm nhiếp ảnh được thiết kế theo cá tính của từng khách hàng.")}</p>
              <div className="mt-10 grid gap-7 border-t border-white/10 pt-8 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {whyCards.map(([title, description], index) => <article key={title}><span className="home-eyebrow">0{index + 1}</span><h3 data-cms-section="about" data-cms-field={`text.value.${index}.title`} className="mt-3 text-lg font-bold">{cmsText(publishedAbout, `value.${index}.title`, title)}</h3><p data-cms-section="about" data-cms-field={`text.value.${index}.description`} className="mt-2 text-sm leading-6 text-[var(--home-text-muted)]">{cmsText(publishedAbout, `value.${index}.description`, description)}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <div aria-hidden="true" className="home-section-divider" />
        <section hidden={publishedSections.gallery?.isEnabled === false} id="mood" data-cms-section-root="gallery" className="bg-[var(--home-background-secondary)] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-3xl text-center">
              <p data-cms-section="gallery" data-cms-field="text.eyebrow" className="home-eyebrow block text-center uppercase">{cmsText(publishedGallery, "eyebrow", "SELECTED COLLECTIONS")}</p>
              <h2 data-cms-section="gallery" data-cms-field="title" className="home-editorial-title home-shine mt-4 text-[clamp(2.5rem,10vw,4.8rem)] leading-[1.15] text-center uppercase">
                {getSectionText(publishedGallery.title, ["Album chọn lọc"], "NHỮNG CONCEPT TIÊU BIỂU")}
              </h2>
              <p data-cms-section="gallery" data-cms-field="description" className="mt-5 max-w-2xl text-base leading-7 text-[var(--home-text-secondary)] mx-auto text-center">
                {getSectionText(publishedGallery.description, ["Sáu album concept tiêu biểu được tuyển chọn từ thư viện TLORA."], "Khám phá những concept được khách hàng yêu thích và đại diện cho ngôn ngữ hình ảnh của TLORA.")}
              </p>
            </div>
            <MobileCarousel label="NHỮNG CONCEPT TIÊU BIỂU" className="mt-4 lg:mt-10 lg:grid-cols-3 lg:gap-7">
              {selectedAlbums.map((album: TloraConceptAlbum, index: number) => <ConceptAlbumCard key={album.id} album={album} order={index + 1} priority={false} />)}
              {!selectedAlbums.length && <p className="w-full rounded-xl border border-dashed border-white/15 p-8 text-center text-[var(--home-text-muted)]">Chưa có Album Concept được xuất bản.</p>}
            </MobileCarousel>
          </div>
        </section>

        <div aria-hidden="true" className="home-section-divider" />
        <section hidden={publishedSections.services?.isEnabled === false} id="dich-vu" data-cms-section-root="services" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-3xl text-center">
              <p data-cms-section="services" data-cms-field="text.eyebrow" className="home-eyebrow block text-center uppercase">{cmsText(publishedServices, "eyebrow", "TLORA SERVICES")}</p>
              <h2 data-cms-section="services" data-cms-field="title" className="home-editorial-title home-shine mt-4 text-[clamp(2.5rem,10vw,5rem)] leading-[1.15] text-center uppercase">
                {getSectionText(publishedServices.title, ["Ba concept, một tiêu chuẩn giá trị", "Dịch vụ nổi bật"], "NGHỆ THUẬT CỦA SỰ CÁ NHÂN HÓA")}
              </h2>
              <p data-cms-section="services" data-cms-field="description" className="mt-5 max-w-2xl text-base leading-8 text-[var(--home-text-secondary)] mx-auto text-center">
                {getSectionText(publishedServices.description, ["Không có gói chụp đại trà. Mỗi dịch vụ được tính đúng theo công sức bỏ vào: tư vấn, set dựng, trang phục, ánh sáng và hậu kỳ."], "Từ ý tưởng, bối cảnh đến hậu kỳ, mọi chi tiết đều được thiết kế để kể câu chuyện của riêng bạn.")}
              </p>
            </div>
            <MobileCarousel label="Dịch vụ TLORA" className="mt-4 lg:mt-12 lg:grid-cols-3 lg:gap-6">{services.map((service) => <ServiceSection key={service.id} service={service} content={publishedServices} />)}</MobileCarousel>
          </div>

          <div className="mx-auto mt-24 max-w-7xl border-t border-white/10 pt-20 sm:mt-32 sm:pt-24">
            <div data-reveal className="mx-auto max-w-3xl text-center">
              <p data-cms-section="services" data-cms-field="text.process.eyebrow" className="home-eyebrow block text-center uppercase">{cmsText(publishedServices, "process.eyebrow", "THE EXPERIENCE")}</p>
              <h2 data-cms-section="services" data-cms-field="text.process.title" className="home-editorial-title mt-4 text-[clamp(2.5rem,10vw,4.8rem)] leading-[1.15] text-center uppercase">
                {getSectionText(cmsText(publishedServices, "process.title", ""), ["Từ lúc đặt lịch đến khi nhận ảnh"], "HÀNH TRÌNH TẠO NÊN MỘT CÂU CHUYỆN")}
              </h2>
              <p data-cms-section="services" data-cms-field="text.process.description" className="mt-5 max-w-2xl text-base leading-7 text-[var(--home-text-secondary)] mx-auto text-center">
                {getSectionText(cmsText(publishedServices, "process.description", ""), ["Năm bước, không có công đoạn nào bị giấu đi. Bạn biết mình đang ở đâu trong quy trình tại mọi thời điểm."], "Từng bước được kết nối liền mạch để biến cảm xúc thành những khung hình mang giá trị lâu dài.")}
              </p>
            </div>
            <ol className="relative mt-12 border-l border-[var(--home-border-subtle)] pl-7 sm:pl-10 lg:grid lg:grid-cols-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-10">
              {processSteps.map(([step, title, description]) => <li key={step} className="relative pb-10 last:pb-0 lg:px-5 lg:pb-0 first:lg:pl-0"><span className="absolute -left-[2.18rem] top-0 grid size-4 place-items-center rounded-full border-4 border-[var(--home-background-primary)] bg-[var(--home-accent-gold)] sm:-left-[2.68rem] lg:-top-12 lg:left-5 lg:size-5 first:lg:left-0" aria-hidden="true" /><span className="home-eyebrow">{step}</span><h3 data-cms-section="services" data-cms-field={`text.process.${step}.title`} className="mt-3 text-lg font-bold">{cmsText(publishedServices, `process.${step}.title`, title)}</h3><p data-cms-section="services" data-cms-field={`text.process.${step}.description`} className="mt-3 text-sm leading-6 text-[var(--home-text-muted)]">{cmsText(publishedServices, `process.${step}.description`, description)}</p></li>)}
            </ol>
          </div>
        </section>

        <div aria-hidden="true" className="home-section-divider" />
        <section className="bg-[var(--home-background-secondary)] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-3xl text-center">
              <p data-cms-section="about" data-cms-field="text.testimonials.eyebrow" className="home-eyebrow block text-center uppercase">{cmsText(publishedAbout, "testimonials.eyebrow", "CLIENT NOTES")}</p>
              <h2 data-cms-section="about" data-cms-field="text.testimonials.title" className="home-editorial-title home-shine mt-4 text-[clamp(2.5rem,10vw,4.8rem)] leading-[1.15] text-center uppercase">
                {getSectionText(cmsText(publishedAbout, "testimonials.title", ""), ["Phản hồi sau buổi chụp"], "NHỮNG CẢM NHẬN SAU HÀNH TRÌNH")}
              </h2>
            </div>
            <MobileCarousel label="Phản hồi khách hàng" className="mt-4 lg:mt-10 lg:grid-cols-3 lg:gap-4">{[["Mình từng nghĩ ảnh sinh nhật chỉ cần thổi nến cho có. Đến lúc nhận ảnh mới thấy giá trị mình bỏ ra hoàn toàn xứng đáng.", "Khách chụp Sinh nhật, tuổi 22"], ["Ảnh retouch vẫn là mặt mình, chỉ là phiên bản sáng và mịn hơn, không bị lạ như nhiều nơi mình từng chụp.", "Khách chụp Beauty Concept"], ["Ba set bối cảnh trong một buổi giúp mình có đủ ảnh cho cả tháng làm content, không phải đặt lịch lại nhiều lần.", "Khách chụp Concept Trang Phục"]].map(([quote, person], index) => <article key={person} className="flex min-h-[310px] flex-col justify-between rounded-[20px] border border-white/10 bg-[var(--home-background-elevated)] p-7"><span className="home-editorial-title text-5xl leading-none text-[var(--home-accent-gold)]">“</span><p data-cms-section="about" data-cms-field={`text.testimonials.${index}.quote`} className="home-editorial-title text-2xl leading-[1.35]">{cmsText(publishedAbout, `testimonials.${index}.quote`, quote)}</p><p data-cms-section="about" data-cms-field={`text.testimonials.${index}.person`} className="mt-7 text-xs font-bold uppercase tracking-[.12em] text-[var(--home-text-muted)]">— {cmsText(publishedAbout, `testimonials.${index}.person`, person)}</p></article>)}</MobileCarousel>
          </div>
        </section>

        <div aria-hidden="true" className="home-section-divider" />
        <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-3xl text-center mb-12 lg:mb-16">
              <p data-cms-section="contact" data-cms-field="text.faq.eyebrow" className="home-eyebrow block text-center uppercase">{cmsText(publishedContact, "faq.eyebrow", "BEFORE YOUR SESSION")}</p>
              <h2 data-cms-section="contact" data-cms-field="text.faq.title" className="home-editorial-title home-shine mt-4 text-[clamp(2.5rem,10vw,4.8rem)] leading-[1.15] text-center uppercase">
                {getSectionText(cmsText(publishedContact, "faq.title", ""), ["Những điều khách thường hỏi trước khi đặt lịch"], "NHỮNG ĐIỀU BẠN CẦN BIẾT")}
              </h2>
            </div>
            <div className="mx-auto max-w-4xl">{faqs.map(([question, answer], index) => <details key={question} open={index === 0} className="group border-b border-white/10"><summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--home-accent-gold)]"><span data-cms-section="contact" data-cms-field={`text.faq.${index}.question`}>{cmsText(publishedContact, `faq.${index}.question`, question)}</span><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 text-xl font-light text-[var(--home-accent-gold)] transition duration-[var(--motion-normal)] group-open:rotate-45">+</span></summary><p data-cms-section="contact" data-cms-field={`text.faq.${index}.answer`} className="max-w-2xl pb-6 pr-14 text-sm leading-7 text-[var(--home-text-muted)]">{cmsText(publishedContact, `faq.${index}.answer`, answer)}</p></details>)}</div>
          </div>
        </section>

        <div aria-hidden="true" className="home-section-divider" />
        <section hidden={publishedSections.contact?.isEnabled === false} id="home-final-cta" data-cms-section-root="contact" className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10 lg:pb-36">
          <div className="relative mx-auto min-h-[520px] max-w-7xl overflow-hidden rounded-[22px] border border-white/10 px-6 py-16 sm:px-10 lg:flex lg:items-center lg:px-16">
            <Image data-cms-section="contact" data-cms-field="images.finalCta" data-cms-image-url={cmsImage(publishedContact, "finalCta", cmsImage(publishedServices, "service.sinh-nhat", services[0].image))} src={cmsImage(publishedContact, "finalCta", cmsImage(publishedServices, "service.sinh-nhat", services[0].image))} alt="Concept chân dung TLORA" fill sizes="100vw" quality={70} className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-[#08090b]/95 via-[#08090b]/78 to-[#08090b]/28" />
            <div className="relative mx-auto max-w-3xl text-center"><p data-cms-section="contact" data-cms-field="text.eyebrow" className="home-eyebrow block text-center uppercase">{cmsText(publishedContact, "eyebrow", "CREATE YOUR STORY")}</p><h2 data-cms-section="contact" data-cms-field="title" className="home-editorial-title mt-5 text-[clamp(2.7rem,11vw,5.4rem)] leading-[1.15] text-center uppercase">{String(publishedContact.title || "Sẵn sàng có một bộ ảnh thể hiện đúng cá tính của bạn?")}</h2><p data-cms-section="contact" data-cms-field="description" className="mt-6 mx-auto max-w-xl text-base leading-7 text-[var(--home-text-secondary)] text-center">{String(publishedContact.description || "Xem giá chụp, chuẩn bị lịch trình và để TLORA lo phần concept. Bạn chỉ cần tới đúng giờ.")}</p><div className="mt-8 flex flex-col gap-3 justify-center min-[430px]:flex-row"><PillLink href="/bang-gia" tone="light"><span data-cms-section="contact" data-cms-field="text.cta.primary">{cmsText(publishedContact, "cta.primary", "Đặt lịch tư vấn")}</span><ArrowRight size={16} aria-hidden="true" /></PillLink><PillLink href="#dich-vu"><span data-cms-section="contact" data-cms-field="text.cta.secondary">{cmsText(publishedContact, "cta.secondary", "Xem lại 3 dịch vụ")}</span></PillLink></div></div>
          </div>
        </section>
      </div>
      <HomeStickyCta bookingHref={String(publishedHero.ctaHref || "/bang-gia")} />
    </>
  );
}

function ServiceSection({ service, content }: { service: (typeof services)[number]; content: Record<string, unknown> }) {
  return (
    <article id={service.id} className="w-[86vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-white/10 bg-[var(--home-background-elevated)] lg:w-auto lg:max-w-none">
      <div className="relative aspect-[4/5] overflow-hidden"><Image data-cms-section="services" data-cms-field={`images.service.${service.id}`} data-cms-image-url={cmsImage(content, `service.${service.id}`, service.image)} src={cmsImage(content, `service.${service.id}`, service.image)} alt={service.title} fill sizes="(min-width: 1024px) 31vw, 86vw" quality={70} className="object-cover transition duration-700 hover:scale-[1.025]" /><div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#08090b]/92 via-transparent to-transparent" /><span className="home-eyebrow absolute left-5 top-5">{service.index}</span><div className="absolute inset-x-0 bottom-0 p-5"><span data-cms-section="services" data-cms-field={`text.service.${service.id}.label`} className="home-eyebrow">{cmsText(content, `service.${service.id}.label`, service.label)}</span><h3 data-cms-section="services" data-cms-field={`text.service.${service.id}.title`} className="home-editorial-title mt-3 line-clamp-3 text-3xl leading-[1.15]">{cmsText(content, `service.${service.id}.title`, service.title)}</h3></div></div>
      <div className="p-5"><p data-cms-section="services" data-cms-field={`text.service.${service.id}.description`} className="line-clamp-3 text-sm leading-6 text-[var(--home-text-secondary)]">{cmsText(content, `service.${service.id}.description`, service.description)}</p><ul className="mt-5 space-y-2">{service.features.map((feature, index) => <li key={feature} className="flex gap-2 text-sm leading-6 text-[var(--home-text-secondary)]"><Check size={14} className="mt-1 shrink-0 text-[var(--home-accent-gold)]" aria-hidden="true" /><span data-cms-section="services" data-cms-field={`text.service.${service.id}.feature.${index}`}>{cmsText(content, `service.${service.id}.feature.${index}`, feature)}</span></li>)}</ul><div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-5"><div><span data-cms-section="services" data-cms-field={`text.service.${service.id}.payLabel`} className="text-xs text-[var(--home-text-muted)]">{cmsText(content, `service.${service.id}.payLabel`, "Bạn trả")}</span><p data-cms-section="services" data-cms-field={`text.service.${service.id}.price`} className="mt-1 text-xl font-bold text-[var(--home-accent-gold-light)]">{cmsText(content, `service.${service.id}.price`, service.price)}</p></div><Link href="/bang-gia" className="grid size-12 place-items-center rounded-md bg-[var(--home-accent-gold)] text-[var(--home-background-primary)]" aria-label={`Đặt lịch ${service.title}`}><ArrowUpRight size={19} aria-hidden="true" /></Link></div>
        <details className="group mt-5 border-t border-white/10 pt-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-bold focus-visible:outline-2 focus-visible:outline-[var(--home-accent-gold)]"><span data-cms-section="services" data-cms-field={`text.service.${service.id}.benefitsLabel`}>{cmsText(content, `service.${service.id}.benefitsLabel`, "Xem đầy đủ quyền lợi")}</span><span aria-hidden="true" className="text-xl font-light text-[var(--home-accent-gold)] transition group-open:rotate-45">+</span></summary><div className="pb-1"><p data-cms-section="services" data-cms-field={`text.service.${service.id}.who`} className="mb-5 text-sm leading-6 text-[var(--home-text-muted)]">{cmsText(content, `service.${service.id}.who`, service.who)}</p><Receipt service={service} content={content} /></div></details>
      </div>
    </article>
  );
}

function Receipt({ service, content }: { service: (typeof services)[number]; content: Record<string, unknown> }) {
  return (
    <div className="rounded-xl bg-[#f5f1e8] px-5 pb-7 pt-6 text-[#241d14] shadow-xl shadow-black/25">
      <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#241d14]/35 pb-4">
        <span data-cms-section="services" data-cms-field={`text.service.${service.id}.receiptLabel`} className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#7a6b52]">{cmsText(content, `service.${service.id}.receiptLabel`, "Hóa đơn giá trị")}</span>
        <span data-cms-section="services" data-cms-field={`text.service.${service.id}.receiptName`} className="font-heading text-sm font-bold">{cmsText(content, `service.${service.id}.receiptName`, service.receiptName)}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {service.items.map(([item, qty], index) => (
          <li key={item} className="flex justify-between gap-4 text-sm">
            <span data-cms-section="services" data-cms-field={`text.service.${service.id}.receipt.${index}.item`}>{cmsText(content, `service.${service.id}.receipt.${index}.item`, item)}</span>
            <i data-cms-section="services" data-cms-field={`text.service.${service.id}.receipt.${index}.qty`} className="shrink-0 font-mono text-xs not-italic text-[#7a6b52]">{cmsText(content, `service.${service.id}.receipt.${index}.qty`, qty)}</i>
          </li>
        ))}
      </ul>
      <div className="my-4 border-t border-dashed border-[#241d14]/35" />
      <div className="flex justify-between font-mono text-sm text-[#5c4f3c]">
        <span data-cms-section="services" data-cms-field={`text.service.${service.id}.estimatedLabel`}>{cmsText(content, `service.${service.id}.estimatedLabel`, "Giá trị ước tính")}</span>
        <b data-cms-section="services" data-cms-field={`text.service.${service.id}.value`} className="font-medium">{cmsText(content, `service.${service.id}.value`, service.value)}</b>
      </div>
      <div className="mt-2 flex justify-between text-lg font-bold text-[#241d14]">
        <span data-cms-section="services" data-cms-field={`text.service.${service.id}.payLabel`}>{cmsText(content, `service.${service.id}.payLabel`, "Bạn trả")}</span>
        <b data-cms-section="services" data-cms-field={`text.service.${service.id}.price`} className="font-mono">{cmsText(content, `service.${service.id}.price`, service.price)}</b>
      </div>
      <div data-cms-section="services" data-cms-field={`text.service.${service.id}.receiptCta`} className="mt-5 rounded border px-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.08em]" style={{ borderColor: service.accent, color: service.accent }}>
        {cmsText(content, `service.${service.id}.receiptCta`, "Nhận nhiều hơn số tiền bỏ ra")}
      </div>
      <p data-cms-section="services" data-cms-field={`text.service.${service.id}.receiptNote`} className="mt-3 text-center text-[11px] text-[#9a8c72]">{cmsText(content, `service.${service.id}.receiptNote`, "*Giá minh họa - cập nhật theo bảng giá thật của studio.")}</p>
    </div>
  );
}

function PillLink({ href, children, tone = "ghost" }: { href: string; children: React.ReactNode; tone?: "ghost" | "light" }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-bold transition active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f0d38a] ${
        tone === "light"
          ? "bg-[var(--home-accent-gold)] text-[var(--home-background-primary)] hover:bg-[var(--home-accent-gold-light)]"
          : "border border-white/20 text-[var(--home-text-primary)] hover:border-[var(--home-border-subtle)] hover:text-[var(--home-accent-gold-light)]"
      }`}
    >
      {children}
    </Link>
  );
}
