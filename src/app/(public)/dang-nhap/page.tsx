import type { Metadata } from "next";
import { Camera } from "lucide-react";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập cổng khách hàng Lumi Concept Studio.",
};

export default function LoginPage() {
  return (
    <section className="grid min-h-[calc(100vh-73px)] place-items-center px-4 py-12">
      <form className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <Camera className="text-rose-600" size={32} />
        <h1 className="mt-5 text-2xl font-bold">Đăng nhập tài khoản</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Supabase Auth xử lý email/password, magic link hoặc OAuth theo cấu hình dự án.</p>
        <label className="mt-6 block text-sm font-semibold" htmlFor="email">Email</label>
        <input id="email" type="email" className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-900" placeholder="you@example.com" />
        <label className="mt-4 block text-sm font-semibold" htmlFor="password">Mật khẩu</label>
        <input id="password" type="password" className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-900" placeholder="••••••••" />
        <button className="mt-6 min-h-11 w-full rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Đăng nhập</button>
      </form>
    </section>
  );
}
