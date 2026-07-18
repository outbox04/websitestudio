"use client";

import { ArrowRight, BadgeDollarSign, Camera, Home, Images, Newspaper, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const defaultNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/album-concept", label: "Album Concept" },
  { href: "/ai-concept", label: "AI Concept" },
  { href: "/tin-tuc", label: "Tin tức" },
];

function BrandLogo({ className, fetchPriority = "auto" }: { className: string; fetchPriority?: "auto" | "high" | "low" }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} aria-hidden="true">
      <Image
        src="/brand/tlora-logo.png"
        alt=""
        width={1536}
        height={1024}
        fetchPriority={fetchPriority}
        loading={fetchPriority === "high" ? "eager" : "lazy"}
        sizes="(min-width: 1024px) 150px, (min-width: 640px) 132px, 116px"
        className="absolute left-1/2 top-1/2 h-[240%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </span>
  );
}

export type SiteContact = { siteName?: string; description?: string; email?: string; phone?: string; address?: string; facebookUrl?: string; facebook_url?: string; zalo?: string; zalo_phone?: string; googleMapsEmbed?: string };

function externalUrl(value: string) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function zaloUrl(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const phone = value.replace(/\D/g, "");
  return phone ? `https://zalo.me/${phone}` : "";
}

function navIcon(href: string) {
  if (href === "/") return Home;
  if (href.includes("bang-gia")) return BadgeDollarSign;
  if (href.includes("album")) return Images;
  if (href.includes("tin-tuc")) return Newspaper;
  return Camera;
}

export function SiteHeader({ navItems = defaultNav, contact }: { navItems?: Array<{ href: string; label: string }>; contact?: SiteContact }) {
  const pathname = usePathname();
  const [pastHero, setPastHero] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const hero = document.querySelector("#home-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0.88 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome]);

  return (
    <>
    <header className={`${isHome ? "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-400" : "sticky top-0 z-40 border-b border-white/10 bg-[#07080a]/85 backdrop-blur-xl"} ${isHome && pastHero ? "border-b border-white/10 bg-[#08090b]/88 backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 ${isHome && pastHero ? "py-2" : "py-2.5 sm:py-3"}`}>
        <Link href="/" className="flex shrink-0 items-center" aria-label="TLORA Studio — Trang chủ">
          <BrandLogo fetchPriority="high" className="h-11 w-[116px] sm:h-12 sm:w-[132px] lg:h-14 lg:w-[150px]" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-300 lg:flex" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-cms-preview-navigation className="transition hover:text-[#f3d88e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f3d88e]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isHome && <Link href="/bang-gia" className="home-button-primary min-h-9 whitespace-nowrap px-3 text-xs sm:min-h-10 sm:px-4 sm:text-sm lg:min-h-11">Đặt lịch <ArrowRight className="hidden min-[390px]:block" size={14} aria-hidden="true" /></Link>}
        </div>
      </div>
    </header>
    <ContactDock contact={contact} />
    <nav id="mobile-site-navigation" className="fixed inset-x-2 bottom-2 z-[60] grid grid-cols-5 overflow-hidden rounded-2xl border border-white/10 bg-[#f8f5ee]/95 px-1 pt-1.5 text-[#51493f] shadow-[0_18px_60px_rgba(0,0,0,.45)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }} aria-label="Điều hướng mobile">
      {navItems.filter((item) => !item.href.includes("ai-concept")).slice(0, 5).map((item) => {
        const Icon = navIcon(item.href);
        const active = pathname === item.href;
        return <Link key={item.href} href={item.href} data-cms-preview-navigation className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[10px] font-semibold transition ${active ? "bg-[#d8b766]/18 text-[#9b731b]" : "hover:bg-black/5"}`}><Icon size={19} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /><span className="w-full truncate">{item.label}</span></Link>;
      })}
    </nav>
    </>
  );
}

function ContactDock({ contact }: { contact?: SiteContact }) {
  const phone = contact?.phone?.trim() || "";
  const facebook = externalUrl((contact?.facebookUrl || contact?.facebook_url || "").trim());
  const zalo = zaloUrl((contact?.zalo || contact?.zalo_phone || "").trim());
  if (!phone && !facebook && !zalo) return null;
  return <div className="fixed bottom-24 right-3 z-[55] flex flex-col gap-2 lg:bottom-6 lg:right-5" aria-label="Liên hệ nhanh">
    {facebook && <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-11 place-items-center rounded-full border-2 border-white bg-[#1877f2] text-xl font-black text-white shadow-lg transition hover:scale-105">f</a>}
    {zalo && <a href={zalo} target="_blank" rel="noreferrer" aria-label="Zalo OA" className="grid size-11 place-items-center rounded-full border-2 border-white bg-[#0068ff] text-[11px] font-black text-white shadow-lg transition hover:scale-105">Zalo</a>}
    {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`Gọi hotline ${phone}`} className="grid size-11 place-items-center rounded-full border-2 border-white bg-[#d8b766] text-[#07080a] shadow-lg transition hover:scale-105"><Phone size={19} aria-hidden="true" /></a>}
  </div>;
}

export function SiteFooter({ contact }: { contact?: SiteContact }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDangKy = pathname === "/dang-ky" || pathname === "/dang-ky-studio";
  const isMinimalFooter = pathname === "/dang-ky" || pathname === "/dang-ky-studio" || pathname === "/dang-nhap";

  if (isMinimalFooter) {
    return (
      <footer className="border-t border-white/10 bg-[#07080a] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {isDangKy ? "TLORA Studio OS" : contact?.siteName || "TLORA Studio"}. Bảo lưu mọi quyền.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Liên kết pháp lý">
            <Link href="/chinh-sach-bao-mat" className="transition hover:text-[#f3d88e]">
              Chính sách bảo mật
            </Link>
            <Link href="/dieu-khoan-dich-vu" className="transition hover:text-[#f3d88e]">
              Điều khoản dịch vụ
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  if (isHome) {
    return (
      <footer className="border-t border-white/10 bg-[#08090b] text-[#aaa297]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.35fr_1fr_1fr] lg:px-10 lg:py-20">
          <div>
            <BrandLogo className="h-16 w-[170px]" />
            <p className="mt-5 max-w-md text-sm leading-7">{contact?.description || "Nơi cá tính trở thành nghệ thuật, với album khách hàng, chọn ảnh trực tuyến và quy trình retouch rõ ràng."}</p>
          </div>
          <div className="text-sm leading-7">
            <p className="home-eyebrow">Liên hệ</p>
            <p className="mt-4 text-[#f5f1e8]">{contact?.email || "hello@tlorastudio.vn"}</p>
            <p className="text-[#f5f1e8]">{contact?.phone || "0901 234 567"}</p>
            {contact?.address && <p className="mt-2">{contact.address}</p>}
          </div>
          <div>
            <p className="home-eyebrow mb-3">Vị trí studio</p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <iframe
                src={contact?.googleMapsEmbed || "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d233.61668559396074!2d106.31679097323517!3d20.470656370154337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2s!4v1784346049212!5m2!1svi!2s"}
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Bản đồ TLORA Studio"
              />
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} {contact?.siteName || "TLORA Studio"}. Bảo lưu mọi quyền.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Liên kết pháp lý">
            <Link href="/chinh-sach-bao-mat" className="transition hover:text-[#f3d88e]">Chính sách bảo mật</Link>
            <Link href="/dieu-khoan-dich-vu" className="transition hover:text-[#f3d88e]">Điều khoản dịch vụ</Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 bg-[#07080a]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-heading text-lg font-bold text-white">{contact?.siteName || "TLORA Studio"}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            {contact?.description || "Nơi cá tính trở thành nghệ thuật, với album khách hàng, chọn ảnh trực tuyến và quy trình retouch rõ ràng."}
          </p>
        </div>
        <div className="text-sm text-zinc-400">
          <p className="font-semibold text-white">Liên hệ</p>
          <p className="mt-3">{contact?.email || "hello@tlorastudio.vn"}</p>
          <p>{contact?.phone || "0901 234 567"}</p>
          {contact?.address && <p>{contact.address}</p>}
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Vị trí studio</p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <iframe
              src={contact?.googleMapsEmbed || "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d233.61668559396074!2d106.31679097323517!3d20.470656370154337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2s!4v1784346049212!5m2!1svi!2s"}
              width="100%"
              height="180"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Bản đồ TLORA Studio"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} {contact?.siteName || "TLORA Studio"}. Bảo lưu mọi quyền.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Liên kết pháp lý">
          <Link href="/chinh-sach-bao-mat" className="transition hover:text-[#f3d88e]">
            Chính sách bảo mật
          </Link>
          <Link href="/dieu-khoan-dich-vu" className="transition hover:text-[#f3d88e]">
            Điều khoản dịch vụ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
