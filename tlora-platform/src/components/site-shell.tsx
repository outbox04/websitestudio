"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const defaultNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/album-concept", label: "Album Concept" },
  { href: "/ai-concept", label: "AI Concept" },
  { href: "/tin-tuc", label: "Tin tức" },
];

export function SiteHeader({ navItems = defaultNav }: { navItems?: Array<{ href: string; label: string }> }) {
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
        <button className="grid size-10 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white lg:hidden" aria-label="Mở menu">
          <Menu size={20} />
        </button>
      </div>
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
          <p className="font-semibold text-white">Vận hành</p>
          <p className="mt-3">Next.js App Router</p>
          <p>Supabase, Google Drive API, Vercel</p>
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
