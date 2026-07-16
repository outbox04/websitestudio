import { ArrowRight, Check, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { TloraPublicPreviewBridge } from "@/components/tlora-cms/tlora-public-preview-bridge";
import { createAdminClient } from "@/lib/supabase/admin";

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

const moodCards = [
  ["Pop Sinh Nhật", "Sinh nhật", "#E8704F", "/concept/concept-02.webp"],
  ["Vintage Tuổi Mới", "Sinh nhật", "#E8704F", "/concept/concept-03.webp"],
  ["Clean Beauty", "Beauty", "#C99A5E", "/concept/concept-06.webp"],
  ["Editorial Beauty", "Beauty", "#C99A5E", "/concept/concept-07.webp"],
  ["Lookbook Tối Giản", "Concept", "#3E6B5E", "/concept/concept-10.webp"],
  ["Color Block", "Concept", "#3E6B5E", "/concept/concept-11.webp"],
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

function cmsImage(content: Record<string, unknown>, key: string, fallback: string) {
  const values = content.images as Record<string, unknown> | undefined;
  return typeof values?.[key] === "string" && values[key] ? String(values[key]) : fallback;
}

const getPublishedHome = cache(async () => {
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

  const sectionMap = Object.fromEntries((sections || []).map((section) => [
    section.section_key,
    { isEnabled: section.is_enabled, content: section.published_content as Record<string, unknown> },
  ])) as Record<string, PublishedSection>;
  return { page, sections: sectionMap };
});

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPublishedHome();
  const title = page?.seo_title || "TLORA Studio";
  const description = page?.seo_description || "TLORA Studio chụp ảnh concept cá nhân, chọn ảnh online và quản lý album riêng.";
  const images = page?.og_image_url ? [page.og_image_url] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images },
  };
}

export default async function HomePage() {
  const { sections: publishedSections } = await getPublishedHome();
  const publishedHero = publishedSections.hero?.isEnabled ? publishedSections.hero.content : {};
  const publishedAbout = publishedSections.about?.isEnabled ? publishedSections.about.content : {};
  const publishedServices = publishedSections.services?.isEnabled ? publishedSections.services.content : {};
  const publishedGallery = publishedSections.gallery?.isEnabled ? publishedSections.gallery.content : {};
  const publishedContact = publishedSections.contact?.isEnabled ? publishedSections.contact.content : {};
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <TloraPublicPreviewBridge />
      <div className="bg-[#14110f] text-[#f4ece0]">
      <section hidden={publishedSections.hero?.isEnabled === false} data-cms-section-root="hero" className="relative min-h-[calc(100svh-73px)] overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <Image
          data-cms-section="hero"
          data-cms-field="image"
          data-cms-image-url={String(publishedHero.image || "/concept/concept-14.webp")}
          src={String(publishedHero.image || "/concept/concept-14.webp")}
          alt="Ảnh nền concept studio TLORA"
          fill
          priority
          unoptimized={Boolean(publishedHero.image)}
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#14110f]/72 sm:bg-[#14110f]/58" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#14110f] via-[#14110f]/86 to-[#14110f]/25" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#14110f] to-transparent" />
        <div className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full border border-[#f4ece0]/10 opacity-45 lg:size-[480px]" />
        <div className="relative mx-auto max-w-6xl">
          <h1 data-cms-section="hero" data-cms-field="title" className="max-w-4xl pt-10 font-heading text-4xl font-extrabold leading-tight text-[#f4ece0] sm:pt-16 sm:text-5xl lg:pt-24 lg:text-7xl">
            {String(publishedHero.title || "Mỗi set chụp là một concept dựng riêng cho bạn.")}
          </h1>
          <p data-cms-section="hero" data-cms-field="description" className="mt-6 max-w-2xl text-base leading-8 text-[#cbc0b0] sm:text-lg">
            {String(publishedHero.description || "TLORA không chụp đại trà. Ba dịch vụ, một tiêu chuẩn duy nhất: ảnh nhận về phải xứng đáng với số tiền bạn bỏ ra.")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <Link data-cms-section="hero" data-cms-field="ctaHref" href={String(publishedHero.ctaHref || "/bang-gia")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f4ece0] px-5 text-sm font-bold text-[#14110f] transition hover:-translate-y-0.5">
              <span data-cms-section="hero" data-cms-field="ctaLabel">{String(publishedHero.ctaLabel || "Đặt lịch tư vấn")}</span> <ArrowRight size={16} />
            </Link>
            <PillLink href="#mood">Xem mood ảnh mẫu</PillLink>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12">
            <span className="w-full font-mono text-xs uppercase tracking-[0.14em] text-[#cbc0b0] sm:w-auto">Bạn đang tìm gì?</span>
            {services.map((service, index) => (
              <a
                key={service.id}
                href={`#${service.id}`}
                className="rounded-full border border-[#f4ece0]/12 px-4 py-2 text-sm font-semibold text-[#f4ece0] shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
                style={{ backgroundColor: service.soft, borderColor: service.accent }}
              >
                <span className="mr-2 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: service.accent }} />
                <span data-cms-section="hero" data-cms-field={`text.quickLink.${index}`}>{cmsText(publishedHero, `quickLink.${index}`, service.label === "CONCEPT TRANG PHỤC" ? "Concept trang phục" : service.label.charAt(0) + service.label.slice(1).toLowerCase())}</span>
              </a>
            ))}
          </div>
          <ul className="mt-8 grid gap-3 border-t border-[#f4ece0]/12 pt-6 sm:mt-9 sm:grid-cols-3">
            {trustItems.map((item, index) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#cbc0b0]">
                <Check size={16} className="text-[#c99a5e]" />
                <span data-cms-section="hero" data-cms-field={`text.trust.${index}`}>{cmsText(publishedHero, `trust.${index}`, item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section hidden={publishedSections.services?.isEnabled === false} id="dich-vu" data-cms-section-root="services" className="px-4 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Eyebrow center>Dịch vụ studio</Eyebrow>
          <h2 data-cms-section="services" data-cms-field="title" className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">{String(publishedServices.title || "Ba concept, một tiêu chuẩn giá trị")}</h2>
          <p data-cms-section="services" data-cms-field="description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            {String(publishedServices.description || "Không có gói chụp đại trà. Mỗi dịch vụ được tính đúng theo công sức bỏ vào: tư vấn, set dựng, trang phục, ánh sáng và hậu kỳ.")}
          </p>
        </div>
      </section>

      {services.map((service) => (
        <ServiceSection key={service.id} service={service} content={publishedServices} />
      ))}

      <section className="bg-[#1c1813] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Quy trình</Eyebrow>
          <h2 data-cms-section="services" data-cms-field="text.process.title" className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">{cmsText(publishedServices, "process.title", "Từ lúc đặt lịch đến khi nhận ảnh")}</h2>
          <p data-cms-section="services" data-cms-field="text.process.description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            {cmsText(publishedServices, "process.description", "Năm bước, không có công đoạn nào bị giấu đi. Bạn biết mình đang ở đâu trong quy trình tại mọi thời điểm.")}
          </p>
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-[#f4ece0]/12 bg-[#f4ece0]/12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-5">
            {processSteps.map(([step, title, description]) => (
              <article key={step} className="bg-[#14110f] p-6 text-left">
                <span className="font-mono text-xs text-[#8c8174]">{step}</span>
                <h3 data-cms-section="services" data-cms-field={`text.process.${step}.title`} className="mt-5 font-heading text-lg font-bold text-[#f4ece0]">{cmsText(publishedServices, `process.${step}.title`, title)}</h3>
                <p data-cms-section="services" data-cms-field={`text.process.${step}.description`} className="mt-3 text-sm leading-6 text-[#8c8174]">{cmsText(publishedServices, `process.${step}.description`, description)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section hidden={publishedSections.about?.isEnabled === false} data-cms-section-root="about" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Khách hàng cần một ekip biết lắng nghe</Eyebrow>
          <h2 data-cms-section="about" data-cms-field="title" className="mx-auto max-w-4xl font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">
            {String(publishedAbout.title || "TLORA giữ buổi chụp riêng tư, rõ ràng và tôn trọng cá tính từng người")}
          </h2>
          <p data-cms-section="about" data-cms-field="description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            {String(publishedAbout.description || "Trải nghiệm nhiếp ảnh được thiết kế theo cá tính của từng khách hàng.")}
          </p>
          <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3 lg:mt-12">
            {whyCards.map(([title, description], index) => (
              <article key={title} className="rounded-2xl border border-[#f4ece0]/12 p-8 text-left">
                <h3 data-cms-section="about" data-cms-field={`text.value.${index}.title`} className="font-heading text-xl font-bold text-[#f4ece0]">{cmsText(publishedAbout, `value.${index}.title`, title)}</h3>
                <p data-cms-section="about" data-cms-field={`text.value.${index}.description`} className="mt-3 text-sm leading-7 text-[#8c8174]">{cmsText(publishedAbout, `value.${index}.description`, description)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section hidden={publishedSections.gallery?.isEnabled === false} id="mood" data-cms-section-root="gallery" className="bg-[#1c1813] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Chọn mood trước khi chốt lịch</Eyebrow>
          <h2 data-cms-section="gallery" data-cms-field="title" className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">{String(publishedGallery.title || "Mỗi mood là một phiên bản ánh sáng và màu khác nhau")}</h2>
          <p data-cms-section="gallery" data-cms-field="description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            {String(publishedGallery.description || "Xem trước không khí của từng mood để chọn đúng cảm xúc bạn muốn mang về, sau đó mới cần quyết định trang phục.")}
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {moodCards.map(([title, type, accent, image], index) => (
              <article key={title} className="text-left">
                <div className="relative aspect-3/4 overflow-hidden rounded-[26px] border border-[#f4ece0]/12">
                  <Image data-cms-section="gallery" data-cms-field={`images.mood.${index}`} data-cms-image-url={cmsImage(publishedGallery, `mood.${index}`, image)} src={cmsImage(publishedGallery, `mood.${index}`, image)} alt={title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#14110f]/80 via-transparent to-transparent" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h3 data-cms-section="gallery" data-cms-field={`text.mood.${index}.title`} className="font-semibold text-[#f4ece0]">{cmsText(publishedGallery, `mood.${index}.title`, title)}</h3>
                  <span data-cms-section="gallery" data-cms-field={`text.mood.${index}.type`} className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ backgroundColor: `${accent}24`, color: accent }}>
                    {cmsText(publishedGallery, `mood.${index}.type`, type)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Khách đã chụp tại TLORA</Eyebrow>
          <h2 data-cms-section="about" data-cms-field="text.testimonials.title" className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">{cmsText(publishedAbout, "testimonials.title", "Phản hồi sau buổi chụp")}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12 lg:gap-6">
            {[
              ["Mình từng nghĩ ảnh sinh nhật chỉ cần thổi nến cho có. Đến lúc nhận ảnh mới thấy giá trị mình bỏ ra hoàn toàn xứng đáng.", "Khách chụp Sinh nhật, tuổi 22"],
              ["Ảnh retouch vẫn là mặt mình, chỉ là phiên bản sáng và mịn hơn, không bị lạ như nhiều nơi mình từng chụp.", "Khách chụp Beauty Concept"],
              ["Ba set bối cảnh trong một buổi giúp mình có đủ ảnh cho cả tháng làm content, không phải đặt lịch lại nhiều lần.", "Khách chụp Concept Trang Phục"],
            ].map(([quote, person], index) => (
              <article key={person} className="rounded-2xl border border-[#f4ece0]/12 bg-[#1c1813] p-7 text-left">
                <p data-cms-section="about" data-cms-field={`text.testimonials.${index}.quote`} className="font-heading text-xl italic leading-8 text-[#f4ece0]">{cmsText(publishedAbout, `testimonials.${index}.quote`, quote)}</p>
                <p data-cms-section="about" data-cms-field={`text.testimonials.${index}.person`} className="mt-5 font-mono text-xs text-[#8c8174]">- {cmsText(publishedAbout, `testimonials.${index}.person`, person)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1c1813] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow center>Câu hỏi thường gặp</Eyebrow>
          <h2 data-cms-section="contact" data-cms-field="text.faq.title" className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">{cmsText(publishedContact, "faq.title", "Những điều khách thường hỏi trước khi đặt lịch")}</h2>
          <div className="mt-10 text-left">
            {faqs.map(([question, answer], index) => (
              <details key={question} open={index === 0} className="group border-b border-[#f4ece0]/12 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#f4ece0]">
                  <span data-cms-section="contact" data-cms-field={`text.faq.${index}.question`}>{cmsText(publishedContact, `faq.${index}.question`, question)}</span>
                  <ChevronDown size={18} className="shrink-0 text-[#8c8174] transition group-open:rotate-180" />
                </summary>
                <p data-cms-section="contact" data-cms-field={`text.faq.${index}.answer`} className="mt-4 max-w-2xl text-sm leading-7 text-[#8c8174]">{cmsText(publishedContact, `faq.${index}.answer`, answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section hidden={publishedSections.contact?.isEnabled === false} data-cms-section-root="contact" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[#f4ece0]/12 bg-[#1c1813] px-6 py-16 text-center sm:px-10">
          <div className="absolute inset-x-0 top-0 h-56 bg-radial-[ellipse_at_top] from-[#c99a5e]/18 to-transparent" />
          <div className="relative">
            <Eyebrow center>Đặt lịch TLORA Studio</Eyebrow>
            <h2 data-cms-section="contact" data-cms-field="title" className="mx-auto max-w-3xl font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">
              {String(publishedContact.title || "Sẵn sàng có một bộ ảnh thể hiện đúng cá tính của bạn?")}
            </h2>
            <p data-cms-section="contact" data-cms-field="description" className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
              {String(publishedContact.description || "Xem giá chụp, chuẩn bị lịch trình và để TLORA lo phần concept. Bạn chỉ cần tới đúng giờ.")}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <PillLink href="/bang-gia" tone="light">
                <span data-cms-section="contact" data-cms-field="text.cta.primary">{cmsText(publishedContact, "cta.primary", "Đặt lịch tư vấn")}</span> <ArrowRight size={16} />
              </PillLink>
              <PillLink href="#dich-vu"><span data-cms-section="contact" data-cms-field="text.cta.secondary">{cmsText(publishedContact, "cta.secondary", "Xem lại 3 dịch vụ")}</span></PillLink>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

function ServiceSection({ service, content }: { service: (typeof services)[number]; content: Record<string, unknown> }) {
  return (
    <section id={service.id} className="border-t border-[#f4ece0]/12 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-[0.85fr_1fr_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <div className="relative aspect-4/5 overflow-hidden rounded-[26px] border border-[#f4ece0]/12">
            <Image data-cms-section="services" data-cms-field={`images.service.${service.id}`} data-cms-image-url={cmsImage(content, `service.${service.id}`, service.image)} src={cmsImage(content, `service.${service.id}`, service.image)} alt={service.title} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#14110f]/70 via-transparent to-transparent" />
            <span data-cms-section="services" data-cms-field={`text.service.${service.id}.mood`} className="absolute bottom-5 left-5 rounded-full border border-[#f4ece0]/20 bg-[#14110f]/55 px-4 py-2 font-mono text-xs tracking-[0.04em] text-[#f4ece0] backdrop-blur">
              {cmsText(content, `service.${service.id}.mood`, service.mood)}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {service.chips.map((chip, index) => (
              <span key={chip} data-cms-section="services" data-cms-field={`text.service.${service.id}.chip.${index}`} className="rounded-full border border-[#f4ece0]/12 px-3 py-1 font-mono text-[11px] text-[#8c8174]">
                {cmsText(content, `service.${service.id}.chip.${index}`, chip)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#8c8174]">
            {service.index} - {service.label}
          </span>
          <h3 data-cms-section="services" data-cms-field={`text.service.${service.id}.title`} className="mt-4 font-heading text-3xl font-extrabold leading-tight text-[#f4ece0] md:text-4xl">{cmsText(content, `service.${service.id}.title`, service.title)}</h3>
          <p data-cms-section="services" data-cms-field={`text.service.${service.id}.description`} className="mt-5 text-base leading-8 text-[#cbc0b0]">{cmsText(content, `service.${service.id}.description`, service.description)}</p>
          <p data-cms-section="services" data-cms-field={`text.service.${service.id}.who`} className="mt-6 border-l-2 pl-4 text-sm leading-7 text-[#8c8174]" style={{ borderColor: service.accent }}>
            {cmsText(content, `service.${service.id}.who`, service.who)}
          </p>
          <ul className="mt-7 space-y-3">
            {service.features.map((feature, index) => (
              <li key={feature} className="flex gap-3 text-sm leading-6 text-[#cbc0b0]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: service.accent }} />
                <span data-cms-section="services" data-cms-field={`text.service.${service.id}.feature.${index}`}>{cmsText(content, `service.${service.id}.feature.${index}`, feature)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <Receipt service={service} content={content} />
        </div>
      </div>
    </section>
  );
}

function Receipt({ service, content }: { service: (typeof services)[number]; content: Record<string, unknown> }) {
  return (
    <div className="rounded-t bg-[#f4ece0] px-5 pb-8 pt-7 text-[#241d14] shadow-2xl shadow-black/35 sm:-rotate-1 sm:px-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#241d14]/35 pb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#7a6b52]">Hóa đơn giá trị</span>
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
        <span>Giá trị ước tính</span>
        <b data-cms-section="services" data-cms-field={`text.service.${service.id}.value`} className="font-medium">{cmsText(content, `service.${service.id}.value`, service.value)}</b>
      </div>
      <div className="mt-2 flex justify-between text-lg font-bold text-[#241d14]">
        <span>Bạn trả</span>
        <b data-cms-section="services" data-cms-field={`text.service.${service.id}.price`} className="font-mono">{cmsText(content, `service.${service.id}.price`, service.price)}</b>
      </div>
      <div className="mt-5 rounded border px-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.08em]" style={{ borderColor: service.accent, color: service.accent }}>
        Nhận nhiều hơn số tiền bỏ ra
      </div>
      <p className="mt-3 text-center text-[11px] text-[#9a8c72]">*Giá minh họa - cập nhật theo bảng giá thật của studio.</p>
    </div>
  );
}

function Eyebrow({ children, center = false, className = "" }: { children: string; center?: boolean; className?: string }) {
  return (
    <p className={`mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-[#8c8174] ${center ? "justify-center" : ""} ${className}`}>
      {!center && <span className="h-px w-5 bg-[#8c8174]" />}
      {children}
    </p>
  );
}

function PillLink({ href, children, tone = "ghost" }: { href: string; children: React.ReactNode; tone?: "ghost" | "light" }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition hover:-translate-y-0.5 ${
        tone === "light"
          ? "bg-[#f4ece0] text-[#14110f] hover:bg-[#e7dac4]"
          : "border border-[#f4ece0]/30 text-[#f4ece0] hover:bg-[#f4ece0]/6"
      }`}
    >
      {children}
    </Link>
  );
}
