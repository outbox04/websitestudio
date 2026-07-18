"use client";

import { Save, Send } from "lucide-react";
import { useState } from "react";
import { cmsSiteSettingsSchema } from "@/schemas/tlora-cms";
import type { TloraSiteSettings } from "@/repositories/tlora/settings-repository";

export function TloraSettingsManager({ initialSettings }: { initialSettings: TloraSiteSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

  async function request(method: "PATCH" | "POST") {
    const parsed = cmsSiteSettingsSchema.safeParse(settings);
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Thiết lập không hợp lệ.");
    const response = await fetch("/api/admin/tlora/settings", { method, headers: { "Content-Type": "application/json" }, body: method === "PATCH" ? JSON.stringify(parsed.data) : undefined });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? method === "PATCH" ? "Đã lưu bản nháp thiết lập." : "Đã xuất bản thiết lập website." : result.error || "Không thể lưu thiết lập.");
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Brand & SEO</p><h1 className="mt-2 text-3xl font-extrabold">Thiết lập TLORA</h1>
      <section className="mt-6 max-w-4xl rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tên website" value={settings.siteName} onChange={(siteName) => setSettings((current) => ({ ...current, siteName }))} />
          <Field label="Email" value={settings.email} onChange={(email) => setSettings((current) => ({ ...current, email }))} />
          <Field label="Điện thoại" value={settings.phone} onChange={(phone) => setSettings((current) => ({ ...current, phone }))} />
          <Field label="Zalo" value={settings.zalo} onChange={(zalo) => setSettings((current) => ({ ...current, zalo }))} />
          <Field label="Facebook" value={settings.facebookUrl} onChange={(facebookUrl) => setSettings((current) => ({ ...current, facebookUrl }))} />
          <Field label="Ảnh OG mặc định" value={settings.defaultOgImage} onChange={(defaultOgImage) => setSettings((current) => ({ ...current, defaultOgImage }))} />
          <div className="sm:col-span-2"><Field label="Mô tả website" value={settings.description} onChange={(description) => setSettings((current) => ({ ...current, description }))} textarea /></div>
          <div className="sm:col-span-2"><Field label="Địa chỉ" value={settings.address} onChange={(address) => setSettings((current) => ({ ...current, address }))} textarea /></div>
          <div className="sm:col-span-2">
            <Field
              label="Google Maps Embed URL"
              value={settings.googleMapsEmbed}
              onChange={(googleMapsEmbed) => setSettings((current) => ({ ...current, googleMapsEmbed }))}
              textarea
              placeholder={'Dán URL từ Google Maps → Chia sẻ → Nhúng bản đồ → Copy src="..."'}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Mở Google Maps → Chia sẻ → <strong>Nhúng bản đồ</strong> → Copy nội dung thuộc tính <code>src="…"</code> trong thẻ &lt;iframe&gt;.
            </p>
          </div>
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-zinc-600">{message}</p>}
        <div className="mt-5 flex gap-2 border-t border-zinc-200 pt-5"><button type="button" onClick={() => request("PATCH")} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white"><Save size={16} /> Lưu bản nháp</button><button type="button" onClick={() => request("POST")} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-zinc-950"><Send size={16} /> Xuất bản</button></div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, textarea = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; placeholder?: string }) {
  return <label className="block text-sm font-bold">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal" /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal" />}</label>;
}

