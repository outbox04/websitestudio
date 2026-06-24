import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type Studio = {
  id: string;
  display_name: string;
  primary_domain: string | null;
  plan: string;
  status: string;
  settings: any;
};

async function getStudio(studioSlug: string): Promise<Studio | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("studios")
    .select("id, display_name, primary_domain, plan, status, settings")
    .eq("slug", studioSlug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ studioSlug: string }> }): Promise<Metadata> {
  const { studioSlug } = await params;
  try {
    const studio = await getStudio(studioSlug);
    if (!studio) return { title: "Studio" };
    return { title: studio.display_name, description: `Website chính thức của ${studio.display_name}.` };
  } catch {
    return { title: "Studio" };
  }
}

export default async function StudioHomePage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  let studio: Studio | null = null;
  try {
    studio = await getStudio(studioSlug);
  } catch {
    notFound();
  }

  if (!studio || studio.status !== "active") notFound();

  const setupCompleted = Boolean(studio.settings?.setup_completed);

  if (!setupCompleted) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#14110f] px-6 py-16 text-[#f4ece0]">
        <section className="w-full max-w-2xl rounded-[2rem] border border-[#c99a5e]/25 bg-[#1c1813] p-8 text-center shadow-2xl shadow-black/30 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#c99a5e]">TLORA Studio</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{studio.display_name}</h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#cbc0b0]">
            Website studio đang được hoàn thiện. Hãy quay lại sớm để khám phá portfolio và các dịch vụ của chúng tôi.
          </p>
          <div className="mt-9 border-t border-white/10 pt-6 text-sm text-[#8c8174]">
            {studio.primary_domain || `${studioSlug}.tlgroup.site`}
          </div>
        </section>
      </main>
    );
  }

  // Fetch studio specific data
  const admin = createAdminClient();
  const [{ data: galleriesData }, { data: postsData }] = await Promise.all([
    admin
      .from("customer_galleries")
      .select("id, customer_name, customer_name_slug, shoot_date, cover_url")
      .eq("studio_id", studio.id)
      .order("shoot_date", { ascending: false })
      .limit(6),
    admin
      .from("posts")
      .select("id, title, slug, excerpt, created_at")
      .eq("studio_id", studio.id)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const galleries = galleriesData || [];
  const posts = postsData || [];

  const contactEmail = studio.settings?.email || `contact@${studioSlug}.tlgroup.site`;
  const contactPhone = studio.settings?.phone || "0901 234 567";
  const contactAddress = studio.settings?.address || "123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh";

  const services = [
    {
      title: "Chân Dung Nghệ Thuật",
      description: "Tập trung khai thác thần thái và vẻ đẹp nguyên bản của bạn dưới ánh sáng studio tiêu chuẩn chuyên nghiệp.",
      features: ["Tư vấn style & makeup", "45-60 phút chụp tại set", "10 file retouch hoàn thiện", "Hỗ trợ trang phục cơ bản"],
      price: "1.290.000đ",
      bgUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Concept Sinh Nhật",
      description: "Dựng set decor và chuẩn bị moodboard riêng theo tính cách & chủ đề kỷ niệm cột mốc tuổi của bạn.",
      features: ["Set bối cảnh hoa/pastel/bóng", "60-90 phút chụp", "15 file retouch hoàn thiện", "Cho mượn phụ kiện concept"],
      price: "1.490.000đ",
      bgUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Lookbook & Thời Trang",
      description: "Đáp ứng đầy đủ yêu cầu chụp sản phẩm, lookbook quảng bá hoặc xây dựng hình ảnh cá nhân chỉn chu.",
      features: ["2-3 set ánh sáng khác nhau", "90-120 phút chụp", "20 file retouch cao cấp", "Đạo diễn tạo dáng chuyên sâu"],
      price: "1.990.000đ",
      bgUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0a08] text-[#f4ece0] selection:bg-[#c99a5e]/30 selection:text-[#f4ece0]">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 py-24 text-center sm:px-12">
        <Image
          src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=80"
          alt="Studio background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 blur-2xs"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0a08]/80 to-[#0d0a08]" />
        
        <div className="relative z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c99a5e]/30 bg-[#c99a5e]/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#c99a5e] uppercase">
            <Sparkles size={14} className="animate-pulse" /> {studio.display_name}
          </div>
          
          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-7xl">
            Lưu giữ cá tính qua <br />
            <span className="bg-gradient-to-r from-[#e6c193] to-[#c99a5e] bg-clip-text text-transparent italic">
              từng khung hình nghệ thuật
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-base leading-8 text-[#cbc0b0] sm:text-lg">
            Chào mừng bạn đến với không gian sáng tạo của {studio.display_name}. Chúng tôi mang tới giải pháp nhiếp ảnh cá nhân hóa từ lên ý tưởng concept, hướng dẫn tạo dáng chuyên nghiệp đến chọn ảnh online tiện lợi.
          </p>
          
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#services"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#c99a5e] hover:bg-[#e6c193] px-8 text-sm font-bold text-[#0d0a08] transition-all hover:scale-105 shadow-lg shadow-[#c99a5e]/20"
            >
              Xem dịch vụ & Bảng giá
            </a>
            <a
              href="#portfolio"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#f4ece0]/20 bg-white/[0.03] hover:bg-white/[0.08] px-8 text-sm font-bold text-[#f4ece0] transition-all hover:scale-105"
            >
              Khám phá portfolio
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#c99a5e]">Our Services</span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dịch vụ nhiếp ảnh chuyên nghiệp</h2>
          <p className="text-sm leading-6 text-[#cbc0b0]">
            Ba concept cốt lõi của studio được thiết kế tỉ mỉ, đáp ứng trọn vẹn mong muốn sở hữu những bức ảnh chất lượng đỉnh cao của bạn.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#161210] p-6 transition-all hover:border-[#c99a5e]/40 hover:-translate-y-1 shadow-xl"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#161210] via-[#161210]/90 to-transparent" />
              <div className="space-y-6">
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-white/5">
                  <Image
                    src={service.bgUrl}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#f4ece0] group-hover:text-[#e6c193] transition-colors">{service.title}</h3>
                <p className="text-xs leading-relaxed text-[#cbc0b0]">{service.description}</p>
                <ul className="space-y-2 text-xs text-[#8c8174]">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="size-1 rounded-full bg-[#c99a5e]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 flex items-baseline justify-between">
                <span className="text-xs text-[#8c8174]">Chi phí trọn gói</span>
                <span className="font-mono text-lg font-bold text-[#c99a5e]">{service.price}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="border-t border-white/5 bg-[#120f0d] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-[#c99a5e]">Portfolio</span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Album khách hàng thực tế</h2>
              <p className="max-w-xl text-xs text-[#cbc0b0]">
                Hãy ghé thăm các sản phẩm thực tế được chụp cho khách hàng tại studio. Click để trải nghiệm tính năng chọn ảnh và xem thành phẩm online.
              </p>
            </div>
            {galleries.length > 0 && (
              <span className="rounded-full border border-[#c99a5e]/30 bg-[#c99a5e]/5 px-4 py-1.5 text-xs font-medium text-[#c99a5e]">
                {galleries.length} album hoạt động
              </span>
            )}
          </div>

          {galleries.length === 0 ? (
            <div className="mt-12 rounded-xl border border-dashed border-white/10 p-12 text-center text-[#8c8174]">
              Chưa có album khách hàng công khai.
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {galleries.map((gallery) => (
                <Link
                  key={gallery.id}
                  href={`/${gallery.customer_name_slug}`}
                  target="_blank"
                  className="group block relative overflow-hidden rounded-2xl border border-white/5 bg-[#161210] transition-all hover:border-[#c99a5e]/30"
                >
                  <div className="relative aspect-4/5 w-full overflow-hidden">
                    <Image
                      src={gallery.cover_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80"}
                      alt={gallery.customer_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a08] via-transparent to-transparent opacity-90" />
                  </div>
                  
                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#c99a5e] uppercase tracking-wider">
                      <Calendar size={11} /> {new Date(gallery.shoot_date).toLocaleDateString("vi-VN")}
                    </span>
                    <h3 className="text-lg font-bold text-white flex items-center justify-between">
                      {gallery.customer_name}
                      <ArrowUpRight size={16} className="text-[#8c8174] group-hover:text-white transition-colors" />
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* News Section */}
      {posts.length > 0 && (
        <section id="news" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#c99a5e]">Studio News</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tin tức mới nhất</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/tin-tuc/${post.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#120f0d] p-6 hover:border-[#c99a5e]/30 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] text-[#8c8174] uppercase tracking-wider font-mono">
                    <Clock size={12} /> {new Date(post.created_at).toLocaleDateString("vi-VN")}
                  </div>
                  <h3 className="text-base font-bold text-[#f4ece0] group-hover:text-[#e6c193] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs leading-relaxed text-[#8c8174] line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <div className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-[#c99a5e] group-hover:text-[#e6c193]">
                  Đọc thêm <ArrowUpRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="border-t border-white/5 bg-[#0b0807] py-20 text-center">
        <div className="mx-auto max-w-4xl px-6 space-y-12 sm:px-8">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-[#c99a5e]">Contact Us</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Hãy bắt đầu buổi chụp của bạn</h2>
            <p className="text-sm text-[#cbc0b0]">
              Bạn đã chọn được concept yêu thích? Hãy liên hệ với chúng tôi để lên lịch tư vấn trực tiếp và chuẩn bị buổi chụp chỉn chu nhất.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-white/5 bg-[#120f0d] p-5 flex items-start gap-4">
              <div className="rounded-lg bg-[#c99a5e]/10 p-3 text-[#c99a5e]">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8c8174] uppercase tracking-wider">Điện thoại</p>
                <p className="mt-1 text-sm font-bold text-white">{contactPhone}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#120f0d] p-5 flex items-start gap-4">
              <div className="rounded-lg bg-[#c99a5e]/10 p-3 text-[#c99a5e]">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8c8174] uppercase tracking-wider">Email</p>
                <p className="mt-1 text-sm font-bold text-white truncate max-w-[180px]">{contactEmail}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#120f0d] p-5 flex items-start gap-4">
              <div className="rounded-lg bg-[#c99a5e]/10 p-3 text-[#c99a5e]">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8c8174] uppercase tracking-wider">Địa chỉ</p>
                <p className="mt-1 text-xs leading-relaxed font-bold text-white">{contactAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

