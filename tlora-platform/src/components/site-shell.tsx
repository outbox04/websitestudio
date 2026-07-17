"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const defaultNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/album-concept", label: "Album Concept" },
  { href: "/ai-concept", label: "AI Concept" },
  { href: "/tin-tuc", label: "Tin tức" },
];

function BrandLogo({ className, priority = false }: { className: string; priority?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} aria-hidden="true">
      <Image
        src="/brand/tlora-logo.png"
        alt=""
        width={1536}
        height={1024}
        priority={priority}
        className="absolute left-1/2 top-1/2 h-[240%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </span>
  );
}

export function SiteHeader({ navItems = defaultNav }: { navItems?: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const hero = document.querySelector("#home-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0.88 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuPanelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={`${isHome ? "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-400" : "sticky top-0 z-40 border-b border-white/10 bg-[#07080a]/85 backdrop-blur-xl"} ${isHome && pastHero ? "border-b border-white/10 bg-[#08090b]/88 backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 ${isHome && pastHero ? "py-2" : "py-2.5 sm:py-3"}`}>
        <Link href="/" className="flex shrink-0 items-center" aria-label="TLORA Studio — Trang chủ">
          <BrandLogo priority className="h-11 w-[116px] sm:h-12 sm:w-[132px] lg:h-14 lg:w-[150px]" />
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
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-9 place-items-center rounded-md border border-[#d8b766]/55 bg-[#08090b]/88 text-[#f3d88e] shadow-lg shadow-black/30 backdrop-blur transition hover:border-[#f3d88e] hover:bg-[#d8b766] hover:text-[#07080a] lg:hidden"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-site-navigation"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div ref={menuPanelRef} id="mobile-site-navigation" className="absolute right-3 top-[calc(100%+6px)] z-[70] w-[min(20rem,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#d8b766]/25 bg-[#0d0e11]/97 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-2 pb-2">
            <BrandLogo className="h-10 w-[108px]" />
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#d8b766]">Điều hướng</span>
          </div>
          <nav className="mt-1 grid gap-0.5" aria-label="Điều hướng chính">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                data-cms-preview-navigation
                className={`flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-semibold transition ${
                  pathname === item.href ? "bg-[#d8b766]/15 text-[#f3d88e]" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}<ArrowRight size={14} className="text-[#d8b766]" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <Link href="/bang-gia" onClick={() => setMenuOpen(false)} className="home-button-primary mt-2 min-h-10 w-full px-4 text-sm">Đặt lịch <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      )}
    </header>
  );
}

export function SiteFooter({ contact }: { contact?: { siteName?: string; description?: string; email?: string; phone?: string; address?: string } }) {
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
          <div className="text-sm leading-7">
            <p className="home-eyebrow">Trải nghiệm</p>
            <p className="mt-4">Tư vấn concept theo phong cách riêng</p>
            <p>Chọn ảnh trực tuyến và nhận album riêng tư</p>
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
        <div className="text-sm text-zinc-400">
          <p className="font-semibold text-white">Trải nghiệm tại TLORA</p>
          <p className="mt-3">Tư vấn concept theo phong cách riêng</p>
          <p>Chọn ảnh trực tuyến và nhận album riêng tư</p>
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
