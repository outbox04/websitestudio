"use client";

import { Activity, FileText, Image, LayoutDashboard, Menu, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/tlora", label: "Trang & Preview", icon: LayoutDashboard },
  { href: "/admin/tlora/posts", label: "Bài viết", icon: FileText },
  { href: "/admin/tlora/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/tlora/media", label: "Media", icon: Image },
  { href: "/admin/tlora/menus", label: "Menu", icon: Menu },
  { href: "/admin/tlora/settings", label: "Thiết lập", icon: Settings },
  { href: "/admin/tlora/activity", label: "Hoạt động", icon: Activity },
];

export function TloraCmsNavigation() {
  const pathname = usePathname();
  return (
    <nav className="mt-5 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin/tlora" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-bold transition lg:w-full ${active ? "bg-[#d8b766] text-[#07080a]" : "text-[#cbc0b0] hover:bg-white/[.06] hover:text-white"}`}>
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
