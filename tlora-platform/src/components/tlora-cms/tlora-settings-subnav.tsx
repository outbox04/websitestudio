"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function TloraSettingsSubnav() { const pathname = usePathname(); return <nav className="flex gap-2 border-b border-zinc-200 bg-white px-4 py-3"><Link href="/admin/tlora/settings" className={`rounded-md px-3 py-2 text-sm font-bold ${pathname === "/admin/tlora/settings" ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>Thiết lập website</Link><Link href="/admin/tlora/settings/users" className={`rounded-md px-3 py-2 text-sm font-bold ${pathname.endsWith("/users") ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>Người dùng</Link></nav>; }
