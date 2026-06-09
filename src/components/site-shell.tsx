import { Camera, LogIn, Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/ai-concept", label: "AI Concept" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-zinc-950 text-white">
            <Camera size={20} />
          </span>
          <span>
            <span className="block font-heading text-base font-bold">Lumi Concept</span>
            <span className="block text-xs text-zinc-500">Studio & AI Lab</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-700 lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-zinc-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/cong-khach-hang" className="bg-white text-zinc-950 ring-1 ring-zinc-200 hover:bg-zinc-50">
            <LogIn size={16} /> Cổng khách hàng
          </ButtonLink>
          <ButtonLink href="/ai-concept">
            <Sparkles size={16} /> Tạo ảnh AI
          </ButtonLink>
        </div>
        <button className="grid size-10 place-items-center rounded-md border border-zinc-200 bg-white lg:hidden" aria-label="Mở menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-heading text-lg font-bold">Lumi Concept Studio</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
            Website mẫu cho studio chụp ảnh concept, quản lý album Google Drive, cổng khách hàng và workflow tạo ảnh AI.
          </p>
        </div>
        <div className="text-sm text-zinc-600">
          <p className="font-semibold text-zinc-950">Liên hệ</p>
          <p className="mt-3">hello@lumi-studio.vn</p>
          <p>0900 000 000</p>
        </div>
        <div className="text-sm text-zinc-600">
          <p className="font-semibold text-zinc-950">Triển khai</p>
          <p className="mt-3">Next.js App Router</p>
          <p>Supabase, Google Drive API, Vercel</p>
        </div>
      </div>
    </footer>
  );
}
