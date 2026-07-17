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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={`${isHome ? "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-400" : "sticky top-0 z-40 border-b border-white/10 bg-[#07080a]/85 backdrop-blur-xl"} ${isHome && pastHero ? "border-b border-white/10 bg-[#08090b]/88 backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 ${isHome && pastHero ? "py-2.5" : "py-3"}`}>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} priority className={`${isHome ? "h-10 sm:h-11" : "h-12"} w-auto object-contain`} />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-300 lg:flex" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-cms-preview-navigation className="transition hover:text-[#f3d88e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f3d88e]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isHome && <Link href="/bang-gia" className="home-button-primary min-h-10 whitespace-nowrap px-3 max-[429px]:!hidden sm:px-4 lg:min-h-11">Đặt lịch <ArrowRight size={15} aria-hidden="true" /></Link>}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-md border border-white/10 bg-[#08090b]/55 text-white backdrop-blur lg:hidden"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-site-navigation"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && isHome && (
        <div ref={menuPanelRef} id="mobile-site-navigation" className="fixed inset-0 z-[70] min-h-svh overflow-y-auto bg-[#08090b] px-5 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu chính">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} className="h-11 w-auto object-contain" />
            <button type="button" onClick={() => setMenuOpen(false)} className="grid size-12 place-items-center rounded-md border border-white/10 text-white" aria-label="Đóng menu"><X size={22} /></button>
          </div>
          <nav className="mx-auto mt-16 grid max-w-lg" aria-label="Điều hướng chính">
            {navItems.map((item, index) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} data-cms-preview-navigation className={`border-b border-white/10 py-5 font-serif text-[clamp(1.8rem,9vw,2.7rem)] leading-none text-[#f5f1e8] transition hover:text-[#f0d38a] [animation:home-hero-copy_.5s_var(--motion-editorial)_both]`} style={{ animationDelay: `${index * 55}ms` }}>
                <span className="mr-4 align-middle font-mono text-[10px] tracking-[.16em] text-[#dfbb63]">{String(index + 1).padStart(2, "0")}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-3">
            <Link href="#mood" onClick={() => setMenuOpen(false)} className="home-button-secondary">Xem album</Link>
            <Link href="/bang-gia" onClick={() => setMenuOpen(false)} className="home-button-primary">Đặt lịch <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      )}
      {menuOpen && !isHome && (
        <nav id="mobile-site-navigation" className="border-t border-white/10 px-4 py-3 lg:hidden" aria-label="Điều hướng chính">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                data-cms-preview-navigation
                className={`flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition ${
                  pathname === item.href ? "bg-[#d8b766]/15 text-[#f3d88e]" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
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
            <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} className="h-14 w-auto object-contain" />
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
            <Link href="#top" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-[#f5f1e8] transition hover:text-[#f0d38a]">Lên đầu trang <ArrowRight className="-rotate-45" size={16} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl overflow-hidden border-t border-white/10 px-5 pt-8 sm:px-8 lg:px-10">
          <p aria-hidden="true" className="home-editorial-title translate-y-[14%] text-center text-[clamp(5rem,20vw,17rem)] leading-[.72] tracking-[-.07em] text-white/[.055]">TLORA</p>
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
