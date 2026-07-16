"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function TloraLibrarySubnav() { const pathname = usePathname(); return <nav className="flex gap-2 border-b border-zinc-200 bg-white px-4 py-3"><Link href="/admin/tlora/library/images" className={`rounded-md px-3 py-2 text-sm font-bold ${pathname.endsWith("/images") ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>Thư viện hình ảnh</Link><Link href="/admin/tlora/library/albums" className={`rounded-md px-3 py-2 text-sm font-bold ${pathname.endsWith("/albums") ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>Album</Link></nav>; }
