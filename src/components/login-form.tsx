"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }

    const redirect = searchParams.get("redirect") || "/admin-studio";
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <Camera className="text-rose-600" size={32} />
      <h1 className="mt-5 text-2xl font-bold">Đăng nhập tài khoản</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Dùng email và mật khẩu đã tạo trong Supabase Auth.
      </p>
      {error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      <label className="mt-6 block text-sm font-semibold" htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-900"
        placeholder="admin@example.com"
      />
      <label className="mt-4 block text-sm font-semibold" htmlFor="password">Mật khẩu</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-900"
        placeholder="••••••••"
      />
      <button
        disabled={loading}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        Đăng nhập
      </button>
    </form>
  );
}
