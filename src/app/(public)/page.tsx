import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Images,
  MessageCircle,
  Star,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui";

const heroStats = [
  ["12+", "concept được dựng mỗi tháng"],
  ["48h", "trả album chọn ảnh online"],
  ["1:1", "brief riêng cho từng khách"],
];

const serviceCards = [
  {
    title: "Chân dung cá nhân",
    description: "Ảnh profile, beauty portrait và hình ảnh cá nhân có định hướng rõ về phong thái.",
    image: "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=82",
  },
  {
    title: "Gia đình và couple",
    description: "Bố cục gần gũi, ánh sáng mềm, màu ảnh sang và album riêng để cả nhà cùng chọn.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=82",
  },
  {
    title: "Lookbook thương hiệu",
    description: "Set chụp phục vụ sản phẩm, thời trang, profile doanh nghiệp và chiến dịch nội dung.",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=82",
  },
  {
    title: "Retouch hậu kỳ",
    description: "Da, dáng, màu và chi tiết được xử lý theo ghi chú, giữ tinh thần tự nhiên của ảnh.",
    image: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=82",
  },
];

const styleCards = [
  {
    title: "Clean Beauty",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Editorial",
    image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Business Portrait",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Family Classic",
    image: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Korean Profile",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=82",
  },
  {
    title: "Luxury Mood",
    image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=700&q=82",
  },
];

const featureSections = [
  {
    title: "Tư vấn concept trước buổi chụp",
    description: "TLORA chuẩn bị moodboard, trang phục, makeup và hướng tạo dáng để khách bước vào set chụp với tâm thế rõ ràng.",
    image: "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1000&q=82",
    points: ["Moodboard theo cá tính", "Checklist trang phục", "Trao đổi trước lịch chụp"],
  },
  {
    title: "Không gian studio tối ưu ánh sáng",
    description: "Set đèn, phông nền và đạo cụ được bố trí theo từng concept, tạo hình ảnh sạch, sang và nhất quán.",
    image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1000&q=82",
    points: ["Ánh sáng mềm", "Nhiều nền chụp", "Điều phối ekip tại set"],
  },
  {
    title: "Chọn ảnh và ghi chú trực tuyến",
    description: "Sau buổi chụp, khách nhận album riêng để xem ảnh, đánh dấu ảnh cần chỉnh và nhập ghi chú cho từng file.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=82",
    points: ["Album riêng tư", "Ghi chú theo từng ảnh", "Tải file khi được mở quyền"],
  },
];

const processSteps = [
  ["01", "Tư vấn brief", "Chọn mục tiêu hình ảnh, phong cách, trang phục và thời lượng phù hợp."],
  ["02", "Chuẩn bị set chụp", "TLORA lên moodboard, setup ánh sáng, makeup và điều phối ekip."],
  ["03", "Chụp tại studio", "Photographer hướng dẫn tạo dáng, chỉnh chi tiết và kiểm tra ảnh ngay tại set."],
  ["04", "Chọn ảnh online", "Khách nhận album riêng, chọn ảnh cần retouch và để lại ghi chú cụ thể."],
  ["05", "Retouch và bàn giao", "File hoàn thiện được upload vào album, khách tải về khi quy trình hoàn tất."],
];

const reasons = [
  "Concept được cá nhân hóa theo tính cách, nghề nghiệp và mục đích sử dụng.",
  "Quy trình chọn ảnh trực tuyến giúp giảm nhắn tin qua lại và tránh sót ghi chú.",
  "Màu ảnh, ánh sáng và retouch được giữ nhất quán trong toàn bộ album.",
  "Khách luôn biết mình đang ở bước nào: đã chọn, cần chỉnh, file đã hoàn thiện.",
];

const faqs = [
  ["Tôi chưa biết chọn concept nào thì sao?", "TLORA sẽ tư vấn dựa trên mục tiêu sử dụng ảnh, phong cách cá nhân và ngân sách của bạn."],
  ["Bao lâu có ảnh để chọn?", "Thông thường album chọn ảnh được gửi trong 24-48 giờ sau buổi chụp, tùy số lượng file."],
  ["Tôi có thể ghi chú chỉnh sửa từng ảnh không?", "Có. Album khách hàng cho phép bạn nhập ghi chú riêng cho từng ảnh cần retouch."],
  ["Khi nào tải được file gốc hoặc file đã chỉnh?", "Quyền tải sẽ được studio mở theo từng album sau khi hoàn tất thanh toán hoặc bàn giao."],
  ["TLORA có chụp lookbook cho thương hiệu không?", "Có. Studio nhận lookbook, profile doanh nghiệp, campaign nội dung và ảnh sản phẩm có người mẫu."],
];

export default function HomePage() {
  return (
    <div className="bg-[#07080a] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <Image
          src="https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1800&q=85"
          alt="Không gian studio chụp ảnh TLORA"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-42"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080a]/45 via-[#07080a]/82 to-[#07080a]" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-end gap-10 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="pb-2">
            <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} priority className="h-auto w-full max-w-sm object-contain" />
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Nơi cá tính trở thành nghệ thuật</p>
            <h1 className="mt-4 max-w-3xl font-heading text-5xl font-extrabold leading-tight text-white md:text-7xl">
              Chụp ảnh concept cao cấp cho cá nhân, gia đình và thương hiệu.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              TLORA xây dựng buổi chụp như một trải nghiệm trọn gói: tư vấn concept, setup studio, hướng dẫn tạo dáng, chọn ảnh online và retouch theo ghi chú.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/bang-gia">
                Xem gói chụp <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/cong-khach-hang" className="border border-white/10 bg-white/[0.06] text-white shadow-none hover:bg-white/10">
                Vào album khách hàng
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/10 bg-black/30 p-4">
                  <p className="text-2xl font-extrabold text-[#f3d88e]">{value}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-zinc-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#101115]/92 p-4 shadow-2xl shadow-black/35 backdrop-blur">
            <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="space-y-3">
                <StudioControl title="Brief cá nhân" icon={MessageCircle} items={["Mục đích sử dụng ảnh", "Phong cách mong muốn", "Trang phục và makeup"]} active />
                <StudioControl title="Set chụp" icon={Clapperboard} items={["Ánh sáng", "Phông nền", "Đạo cụ"]} />
                <StudioControl title="Bàn giao" icon={Images} items={["Album online", "Ghi chú retouch", "File hoàn thiện"]} />
              </div>
              <div className="overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="grid grid-cols-2 gap-px bg-white/10">
                  {[
                    "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=800&q=82",
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=82",
                  ].map((src, index) => (
                    <div key={src} className="relative aspect-[4/5] bg-zinc-900">
                      <Image src={src} alt={`Ảnh concept TLORA ${index + 1}`} fill sizes="(min-width: 1024px) 320px, 50vw" className="object-cover" />
                      <span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
                        {index === 0 ? "Trước buổi chụp" : "Concept hoàn thiện"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 p-4">
                  <p className="text-sm font-semibold text-white">Một buổi chụp được chuẩn bị như một dự án hình ảnh riêng.</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">Từ brief, moodboard đến album bàn giao đều được gom về một quy trình dễ theo dõi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DarkSection eyebrow="Dịch vụ studio" title="Concept được thiết kế cho từng mục tiêu hình ảnh" description="Mỗi gói chụp bắt đầu từ nhu cầu thật: ảnh cá nhân, ảnh gia đình, hồ sơ doanh nghiệp hoặc lookbook thương hiệu.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((card) => (
            <article key={card.title} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
              <div className="relative aspect-[4/5]">
                <Image src={card.image} alt={card.title} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </DarkSection>

      <DarkSection eyebrow="Phong cách nổi bật" title="Chọn mood ảnh trước khi bước vào set chụp" description="Các hướng hình ảnh phổ biến giúp khách dễ hình dung tone, ánh sáng, trang phục và mức độ retouch mong muốn.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {styleCards.map((style) => (
            <article key={style.title} className="group overflow-hidden rounded-lg border border-white/10 bg-[#101115]">
              <div className="relative aspect-[3/4]">
                <Image src={style.image} alt={style.title} fill sizes="(min-width: 1024px) 16vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <h3 className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white">{style.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </DarkSection>

      <section className="border-y border-white/10 bg-white/[0.025] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Trước khi chụp</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">Không chỉ là ảnh đẹp, mà là hình ảnh dùng được lâu dài</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-zinc-400">
            Một bộ ảnh tốt có thể dùng cho hồ sơ cá nhân, thương hiệu, mạng xã hội, profile doanh nghiệp hoặc kỷ niệm gia đình. TLORA giúp bạn chuẩn bị đủ kỹ để ảnh vừa đẹp vừa đúng mục đích.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-14">
          {featureSections.map((feature, index) => (
            <div key={feature.title} className={`grid gap-8 lg:grid-cols-2 lg:items-center ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Điểm mạnh {index + 1}</p>
                <h2 className="mt-3 font-heading text-3xl font-extrabold text-white">{feature.title}</h2>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{feature.description}</p>
                <ul className="mt-5 space-y-3">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                      <CheckCircle2 size={17} className="text-[#d8b766]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl shadow-black/20">
                <Image src={feature.image} alt={feature.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <DarkSection eyebrow="Vì sao chọn TLORA" title="Một quy trình studio rõ ràng từ lúc đặt lịch đến khi tải file" description="Không để khách phải tự đoán mình cần chuẩn bị gì, chọn ảnh thế nào hoặc file đã chỉnh đang ở đâu.">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {reasons.map((reason, index) => (
            <div key={reason} className="rounded-lg border border-white/10 bg-[#101115] p-5">
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d8b766] text-sm font-extrabold text-black">{index + 1}</span>
                <p className="text-sm leading-7 text-zinc-300">{reason}</p>
              </div>
            </div>
          ))}
        </div>
      </DarkSection>

      <DarkSection eyebrow="Quy trình" title="Cách một bộ ảnh TLORA được thực hiện" description="Từ brief đến bàn giao file, mỗi bước đều có đầu việc rõ ràng để khách dễ theo dõi và ekip dễ xử lý.">
        <div className="grid gap-4 md:grid-cols-5">
          {processSteps.map(([step, title, description]) => (
            <article key={step} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-2xl font-extrabold text-[#d8b766]">{step}</p>
              <h3 className="mt-4 font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
            </article>
          ))}
        </div>
      </DarkSection>

      <DarkSection eyebrow="Tin tưởng" title="Khách hàng cần một ekip biết lắng nghe" description="TLORA giữ buổi chụp nhẹ nhàng, có hướng dẫn rõ ràng và tôn trọng cá tính riêng của từng người.">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            ["Tư vấn dễ hiểu", "Không dùng thuật ngữ khó, mọi lựa chọn đều gắn với mục đích sử dụng ảnh."],
            ["Tạo dáng tự nhiên", "Photographer hướng dẫn từng chi tiết nhỏ để khách không bị cứng trước ống kính."],
            ["Hậu kỳ có kiểm soát", "Retouch giữ nét riêng, không làm mất cấu trúc gương mặt hoặc cảm xúc của ảnh."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-lg border border-white/10 bg-[#101115] p-5 text-center">
              <Star className="mx-auto text-[#d8b766]" size={24} />
              <h3 className="mt-4 font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
            </article>
          ))}
        </div>
      </DarkSection>

      <DarkSection eyebrow="FAQ" title="Câu hỏi thường gặp" description="Những điều khách thường cần biết trước khi đặt lịch chụp tại TLORA Studio.">
        <div className="mx-auto max-w-4xl space-y-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-lg border border-white/10 bg-[#101115] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white">
                {question}
                <ChevronDown size={18} className="shrink-0 text-[#d8b766] transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{answer}</p>
            </details>
          ))}
        </div>
      </DarkSection>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-[#101115] p-8 text-center shadow-2xl shadow-black/25">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Đặt lịch TLORA Studio</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-extrabold text-white md:text-4xl">
            Sẵn sàng có một bộ ảnh thể hiện đúng cá tính của bạn?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Xem gói chụp, chuẩn bị brief và để TLORA tư vấn concept phù hợp với mục tiêu hình ảnh của bạn.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/bang-gia">
              Xem bảng giá <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/tin-tuc" className="border border-white/10 bg-white/[0.06] text-white shadow-none hover:bg-white/10">
              Đọc hướng dẫn chuẩn bị
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function StudioControl({
  title,
  icon: Icon,
  items,
  active = false,
}: {
  title: string;
  icon: typeof Camera;
  items: string[];
  active?: boolean;
}) {
  return (
    <div className={`rounded-md border p-4 ${active ? "border-[#d8b766]/40 bg-[#d8b766]/10" : "border-white/10 bg-black/25"}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md bg-black/30 text-[#d8b766]">
          <Icon size={18} />
        </span>
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            <span className="size-1.5 rounded-full bg-[#d8b766]" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function DarkSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b766]">{eyebrow}</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">{title}</h2>
          <p className="mt-4 text-base leading-7 text-zinc-400">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
