"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin/tlora/posts", "Tất cả bài viết"],
  ["/admin/tlora/posts/new", "Thêm bài viết"],
  ["/admin/tlora/posts/categories", "Danh mục"],
  ["/admin/tlora/posts/keywords", "Từ khóa"],
] as const;

export function TloraPostsSubnav() {
  const pathname = usePathname();
  return <nav className="flex flex-wrap gap-2 border-b border-zinc-200 bg-white px-4 py-3">{items.map(([href, label]) => <Link key={href} href={href} className={`rounded-md px-3 py-2 text-sm font-bold ${pathname === href ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>{label}</Link>)}</nav>;
}
