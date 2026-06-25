import { ArrowRight, Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
    image: "/brand/tlora-logo.png",
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
    image: "/brand/tlora-logo.png",
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
    image: "/brand/tlora-logo.png",
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
  ["Pop Sinh Nhật", "Sinh nhật", "#E8704F", "/brand/tlora-logo.png"],
  ["Vintage Tuổi Mới", "Sinh nhật", "#E8704F", "/brand/tlora-logo.png"],
  ["Clean Beauty", "Beauty", "#C99A5E", "/brand/tlora-logo.png"],
  ["Editorial Beauty", "Beauty", "#C99A5E", "/brand/tlora-logo.png"],
  ["Lookbook Tối Giản", "Concept", "#3E6B5E", "/brand/tlora-logo.png"],
  ["Color Block", "Concept", "#3E6B5E", "/brand/tlora-logo.png"],
];

const faqs = [
  ["Tôi chưa biết chọn concept nào thì sao?", "TLORA tư vấn dựa trên mục đích dùng ảnh và tính cách của bạn trước khi chốt mood, trang phục và bối cảnh. Bạn không cần tự nghĩ ra concept từ đầu."],
  ["Buổi chụp kéo dài bao lâu?", "Tùy dịch vụ: 60-90 phút cho Sinh nhật, 45-60 phút cho Beauty, 90-120 phút cho Concept trang phục có nhiều set bối cảnh."],
  ["Tôi có thể đổi trang phục bao nhiêu lần?", "Mỗi dịch vụ có số lượt đổi trang phục cụ thể, được ghi rõ trong hóa đơn giá trị của từng concept ở trên."],
  ["Ảnh có được chỉnh sửa da tự nhiên không?", "Có. TLORA retouch giữ nét gương mặt thật, chỉ làm sáng và mịn da hợp lý, không thay đổi cấu trúc khuôn mặt."],
  ["Bao lâu thì nhận được ảnh?", "Khách chọn ảnh online trong 48h sau buổi chụp, ảnh đã retouch được bàn giao theo lịch hẹn cụ thể tại buổi tư vấn."],
];

export default function HomePage() {
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
      <div className="bg-[#14110f] text-[#f4ece0]">
      <section className="relative min-h-[calc(100svh-73px)] overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <Image
          src="/brand/tlora-logo.png"
          alt="Ảnh nền concept studio TLORA"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-[#14110f]/72 sm:bg-[#14110f]/58" />
        <div className="absolute inset-0 bg-linear-to-r from-[#14110f] via-[#14110f]/86 to-[#14110f]/25" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#14110f] to-transparent" />
        <div className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full border border-[#f4ece0]/10 opacity-45 lg:size-[480px]" />
        <div className="relative mx-auto max-w-6xl">
          <h1 className="max-w-4xl pt-10 font-heading text-4xl font-extrabold leading-tight text-[#f4ece0] sm:pt-16 sm:text-5xl lg:pt-24 lg:text-7xl">
            Mỗi set chụp là <span className="italic text-[#c99a5e]">một concept</span>
            <br />
            dựng riêng cho bạn.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#cbc0b0] sm:text-lg">
            TLORA không chụp đại trà. Ba dịch vụ, một tiêu chuẩn duy nhất: ảnh nhận về phải xứng đáng với số tiền bạn bỏ ra.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <PillLink href="/bang-gia" tone="light">
              Đặt lịch tư vấn <ArrowRight size={16} />
            </PillLink>
            <PillLink href="#mood">Xem mood ảnh mẫu</PillLink>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12">
            <span className="w-full font-mono text-xs uppercase tracking-[0.14em] text-[#cbc0b0] sm:w-auto">Bạn đang tìm gì?</span>
            {services.map((service) => (
              <a
                key={service.id}
                href={`#${service.id}`}
                className="rounded-full border border-[#f4ece0]/12 px-4 py-2 text-sm font-semibold text-[#f4ece0] shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
                style={{ backgroundColor: service.soft, borderColor: service.accent }}
              >
                <span className="mr-2 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: service.accent }} />
                {service.label === "CONCEPT TRANG PHỤC" ? "Concept trang phục" : service.label.charAt(0) + service.label.slice(1).toLowerCase()}
              </a>
            ))}
          </div>
          <ul className="mt-8 grid gap-3 border-t border-[#f4ece0]/12 pt-6 sm:mt-9 sm:grid-cols-3">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#cbc0b0]">
                <Check size={16} className="text-[#c99a5e]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="dich-vu" className="px-4 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Eyebrow center>Dịch vụ studio</Eyebrow>
          <h2 className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">Ba concept, một tiêu chuẩn giá trị</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            Không có gói chụp đại trà. Mỗi dịch vụ được tính đúng theo công sức bỏ vào: tư vấn, set dựng, trang phục, ánh sáng và hậu kỳ.
          </p>
        </div>
      </section>

      {services.map((service) => (
        <ServiceSection key={service.id} service={service} />
      ))}

      <section className="bg-[#1c1813] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Quy trình</Eyebrow>
          <h2 className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">Từ lúc đặt lịch đến khi nhận ảnh</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            Năm bước, không có công đoạn nào bị giấu đi. Bạn biết mình đang ở đâu trong quy trình tại mọi thời điểm.
          </p>
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-[#f4ece0]/12 bg-[#f4ece0]/12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-5">
            {processSteps.map(([step, title, description]) => (
              <article key={step} className="bg-[#14110f] p-6 text-left">
                <span className="font-mono text-xs text-[#8c8174]">{step}</span>
                <h3 className="mt-5 font-heading text-lg font-bold text-[#f4ece0]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#8c8174]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Khách hàng cần một ekip biết lắng nghe</Eyebrow>
          <h2 className="mx-auto max-w-4xl font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">
            TLORA giữ buổi chụp riêng tư, rõ ràng và tôn trọng cá tính từng người
          </h2>
          <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3 lg:mt-12">
            {whyCards.map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-[#f4ece0]/12 p-8 text-left">
                <h3 className="font-heading text-xl font-bold text-[#f4ece0]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#8c8174]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="mood" className="bg-[#1c1813] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Chọn mood trước khi chốt lịch</Eyebrow>
          <h2 className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">Mỗi mood là một phiên bản ánh sáng và màu khác nhau</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
            Xem trước không khí của từng mood để chọn đúng cảm xúc bạn muốn mang về, sau đó mới cần quyết định trang phục.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {moodCards.map(([title, type, accent, image]) => (
              <article key={title} className="text-left">
                <div className="relative aspect-3/4 overflow-hidden rounded-[26px] border border-[#f4ece0]/12">
                  <Image src={image} alt={title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-[#14110f]/80 via-transparent to-transparent" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-[#f4ece0]">{title}</h3>
                  <span className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ backgroundColor: `${accent}24`, color: accent }}>
                    {type}
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
          <h2 className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">Phản hồi sau buổi chụp</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12 lg:gap-6">
            {[
              ["Mình từng nghĩ ảnh sinh nhật chỉ cần thổi nến cho có. Đến lúc nhận ảnh mới thấy giá trị mình bỏ ra hoàn toàn xứng đáng.", "Khách chụp Sinh nhật, tuổi 22"],
              ["Ảnh retouch vẫn là mặt mình, chỉ là phiên bản sáng và mịn hơn, không bị lạ như nhiều nơi mình từng chụp.", "Khách chụp Beauty Concept"],
              ["Ba set bối cảnh trong một buổi giúp mình có đủ ảnh cho cả tháng làm content, không phải đặt lịch lại nhiều lần.", "Khách chụp Concept Trang Phục"],
            ].map(([quote, person]) => (
              <article key={person} className="rounded-2xl border border-[#f4ece0]/12 bg-[#1c1813] p-7 text-left">
                <p className="font-heading text-xl italic leading-8 text-[#f4ece0]">{quote}</p>
                <p className="mt-5 font-mono text-xs text-[#8c8174]">- {person}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1c1813] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow center>Câu hỏi thường gặp</Eyebrow>
          <h2 className="font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">Những điều khách thường hỏi trước khi đặt lịch</h2>
          <div className="mt-10 text-left">
            {faqs.map(([question, answer], index) => (
              <details key={question} open={index === 0} className="group border-b border-[#f4ece0]/12 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#f4ece0]">
                  {question}
                  <ChevronDown size={18} className="shrink-0 text-[#8c8174] transition group-open:rotate-180" />
                </summary>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8c8174]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[#f4ece0]/12 bg-[#1c1813] px-6 py-16 text-center sm:px-10">
          <div className="absolute inset-x-0 top-0 h-56 bg-radial-[ellipse_at_top] from-[#c99a5e]/18 to-transparent" />
          <div className="relative">
            <Eyebrow center>Đặt lịch TLORA Studio</Eyebrow>
            <h2 className="mx-auto max-w-3xl font-heading text-3xl font-extrabold text-[#f4ece0] md:text-5xl">
              Sẵn sàng có một bộ ảnh thể hiện đúng cá tính của bạn?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#cbc0b0]">
              Xem giá chụp, chuẩn bị lịch trình và để TLORA lo phần concept. Bạn chỉ cần tới đúng giờ.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <PillLink href="/bang-gia" tone="light">
                Đặt lịch tư vấn <ArrowRight size={16} />
              </PillLink>
              <PillLink href="#dich-vu">Xem lại 3 dịch vụ</PillLink>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

function ServiceSection({ service }: { service: (typeof services)[number] }) {
  return (
    <section id={service.id} className="border-t border-[#f4ece0]/12 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-[0.85fr_1fr_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <div className="relative aspect-4/5 overflow-hidden rounded-[26px] border border-[#f4ece0]/12">
            <Image src={service.image} alt={service.title} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-[#14110f]/70 via-transparent to-transparent" />
            <span className="absolute bottom-5 left-5 rounded-full border border-[#f4ece0]/20 bg-[#14110f]/55 px-4 py-2 font-mono text-xs tracking-[0.04em] text-[#f4ece0] backdrop-blur">
              {service.mood}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {service.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-[#f4ece0]/12 px-3 py-1 font-mono text-[11px] text-[#8c8174]">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#8c8174]">
            {service.index} - {service.label}
          </span>
          <h3 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-[#f4ece0] md:text-4xl">{service.title}</h3>
          <p className="mt-5 text-base leading-8 text-[#cbc0b0]">{service.description}</p>
          <p className="mt-6 border-l-2 pl-4 text-sm leading-7 text-[#8c8174]" style={{ borderColor: service.accent }}>
            {service.who}
          </p>
          <ul className="mt-7 space-y-3">
            {service.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm leading-6 text-[#cbc0b0]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: service.accent }} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <Receipt service={service} />
        </div>
      </div>
    </section>
  );
}

function Receipt({ service }: { service: (typeof services)[number] }) {
  return (
    <div className="rounded-t bg-[#f4ece0] px-5 pb-8 pt-7 text-[#241d14] shadow-2xl shadow-black/35 sm:-rotate-1 sm:px-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#241d14]/35 pb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#7a6b52]">Hóa đơn giá trị</span>
        <span className="font-heading text-sm font-bold">{service.receiptName}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {service.items.map(([item, qty]) => (
          <li key={item} className="flex justify-between gap-4 text-sm">
            <span>{item}</span>
            <i className="shrink-0 font-mono text-xs not-italic text-[#7a6b52]">{qty}</i>
          </li>
        ))}
      </ul>
      <div className="my-4 border-t border-dashed border-[#241d14]/35" />
      <div className="flex justify-between font-mono text-sm text-[#5c4f3c]">
        <span>Giá trị ước tính</span>
        <b className="font-medium">{service.value}</b>
      </div>
      <div className="mt-2 flex justify-between text-lg font-bold text-[#241d14]">
        <span>Bạn trả</span>
        <b className="font-mono">{service.price}</b>
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
