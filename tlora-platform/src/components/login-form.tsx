"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      setError("Chưa cấu hình Supabase URL hoặc publishable key trong .env.local.");
      return;
    }

    let emailToAuth = identifier.trim().toLowerCase();

    // If identifier is not an email, lookup the email from the username
    if (emailToAuth && !emailToAuth.includes("@")) {
      try {
        const res = await fetch(`/api/auth/resolve-email?username=${encodeURIComponent(emailToAuth)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            emailToAuth = data.email;
          } else {
            setLoading(false);
            setError("Tên đăng nhập không tồn tại.");
            return;
          }
        } else {
          setLoading(false);
          setError("Lỗi máy chủ khi xác minh tên đăng nhập.");
          return;
        }
      } catch {
        setLoading(false);
        setError("Không kết nối được máy chủ xác minh.");
        return;
      }
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setError("Email chưa được xác nhận trong Supabase Auth.");
      } else if (signInError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Tên đăng nhập/email hoặc mật khẩu không đúng.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    const redirect = searchParams.get("redirect") || "/admin-studio";
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1813] p-8 shadow-2xl shadow-black/55 text-[#f4ece0]"
      style={{ fontFamily: "var(--font-body), sans-serif" }}
    >
      <div className="flex justify-center mb-4">
        <div style={{ width: 56, height: 56, borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201,154,94,0.2)", background: "rgba(201,154,94,0.1)" }}>
          <Camera className="text-[#c99a5e]" size={28} />
        </div>
      </div>
      <h1 className="text-center text-2xl font-extrabold text-[#f4ece0]" style={{ letterSpacing: "-.02em" }}>Đăng nhập tài khoản</h1>
      <p className="mt-2 text-center text-sm leading-6 text-[#cbc0b0]">
        Dùng email hoặc tên đăng nhập và mật khẩu của bạn.
      </p>
      {error && (
        <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm font-medium text-red-300 text-center">
          {error}
        </div>
      )}
      
      <div className="mt-6">
        <label className="block text-sm font-semibold text-[#cbc0b0]" htmlFor="identifier">
          Email hoặc Tên đăng nhập
        </label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 text-[#f4ece0] outline-none transition focus:border-[#c99a5e] focus:ring-1 focus:ring-[#c99a5e]/50"
          placeholder="Tên đăng nhập hoặc email"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-[#cbc0b0]" htmlFor="password">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 text-[#f4ece0] outline-none transition focus:border-[#c99a5e] focus:ring-1 focus:ring-[#c99a5e]/50"
          placeholder="••••••••"
        />
      </div>

      <button
        disabled={loading}
        className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f4ece0] px-5 py-3 text-sm font-bold text-[#14110f] transition hover:bg-[#c99a5e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        Đăng nhập
      </button>
    </form>
  );
}
