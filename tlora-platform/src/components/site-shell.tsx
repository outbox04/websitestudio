"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07080a]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} priority className="h-12 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-300 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-cms-preview-navigation className="transition hover:text-[#f3d88e]">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-11 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white lg:hidden"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-site-navigation"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
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
