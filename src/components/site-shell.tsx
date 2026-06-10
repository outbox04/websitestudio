import { Menu, Sparkles } from "lucide-react";
import Image from "next/image";
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07080a]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} priority className="h-12 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-300 lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[#f3d88e]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/ai-concept">
            <Sparkles size={16} /> Tạo ảnh AI
          </ButtonLink>
        </div>
        <button className="grid size-10 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white lg:hidden" aria-label="Mở menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#07080a]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-heading text-lg font-bold text-white">TLORA Studio</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Nơi cá tính trở thành nghệ thuật, với album khách hàng, chọn ảnh trực tuyến và workflow tạo ảnh AI.
          </p>
        </div>
        <div className="text-sm text-zinc-400">
          <p className="font-semibold text-white">Liên hệ</p>
          <p className="mt-3">hello@tlorastudio.vn</p>
          <p>0901 234 567</p>
        </div>
        <div className="text-sm text-zinc-400">
          <p className="font-semibold text-white">Vận hành</p>
          <p className="mt-3">Next.js App Router</p>
          <p>Supabase, Google Drive API, Vercel</p>
        </div>
      </div>
    </footer>
  );
}
