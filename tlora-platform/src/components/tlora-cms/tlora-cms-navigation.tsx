"use client";

import { Activity, FileText, Images, LayoutDashboard, Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/admin/tlora-preview", label: "Trang & Preview", icon: LayoutDashboard },
  { href: "/admin/tlora/posts", label: "Bài viết", icon: FileText },
  { href: "/admin/tlora/library", label: "Thư viện", icon: Images },
  { href: "/admin/tlora/menus", label: "Menu", icon: Menu },
  { href: "/admin/tlora/settings", label: "Thiết lập", icon: Settings },
  { href: "/admin/tlora/activity", label: "Hoạt động", icon: Activity },
];

export function TloraCmsNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<{ href: string; from: string } | null>(null);
  const visualPath = pendingNavigation?.from === pathname ? pendingNavigation.href : pathname;

  useEffect(() => {
    links.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  return (
    <nav className="mt-5 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = visualPath.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            scroll={false}
            onClick={() => setPendingNavigation({ href, from: pathname })}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors duration-100 lg:w-full ${active ? "bg-[#d8b766] text-[#07080a]" : "text-[#cbc0b0] hover:bg-white/[.06] hover:text-white"}`}
          >
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
