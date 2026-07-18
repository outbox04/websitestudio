"use client";

import { Save, Send } from "lucide-react";
import { useState } from "react";
import { cmsSiteSettingsSchema, extractGoogleMapsUrl } from "@/schemas/tlora-cms";
import type { TloraSiteSettings } from "@/repositories/tlora/settings-repository";

export function TloraSettingsManager({ initialSettings }: { initialSettings: TloraSiteSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const previewMapUrl = extractGoogleMapsUrl(settings.googleMapsEmbed);

  async function saveAndPublish() {
    setSaving(true);
    setMessage("");
    try {
      const parsed = cmsSiteSettingsSchema.safeParse(settings);
      if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Thiết lập không hợp lệ.");

      const patchResponse = await fetch("/api/admin/tlora/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!patchResponse.ok) {
        const patchResult = await patchResponse.json() as { error?: string };
        return setMessage(patchResult.error || "Không thể lưu thiết lập.");
      }

      const postResponse = await fetch("/api/admin/tlora/settings", { method: "POST" });
      const postResult = await postResponse.json() as { error?: string };
      if (postResponse.ok) {
        setSettings((current) => ({ ...current, googleMapsEmbed: parsed.data.googleMapsEmbed }));
        setMessage("Đã lưu và xuất bản thiết lập website.");
      } else {
        setMessage(postResult.error || "Không thể xuất bản thiết lập.");
      }
    } finally {
      setSaving(false);
    }
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
              placeholder={'Dán đoạn mã <iframe src="..."></iframe> hoặc URL Google Maps nhúng vào đây'}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Có thể dán trực tiếp toàn bộ thẻ <code>&lt;iframe&gt;</code> từ Google Maps. Khi bấm Xuất bản, hệ thống sẽ tự động tách URL <code>src</code> để lưu.
            </p>
            {previewMapUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                <p className="border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700">
                  Xem trước bản đồ:
                </p>
                <div className="p-2">
                  <iframe
                    src={previewMapUrl}
                    width="100%"
                    height="220"
                    style={{ border: 0, borderRadius: "8px" }}
                    loading="lazy"
                    title="Bản đồ xem trước"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-zinc-600">{message}</p>}
        <div className="mt-5 flex gap-2 border-t border-zinc-200 pt-5">
          <button type="button" disabled={saving} onClick={saveAndPublish} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-zinc-950 hover:bg-[#c9a655] disabled:opacity-50">
            <Send size={16} /> {saving ? "Đang lưu..." : "Xuất bản thiết lập"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, textarea = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; placeholder?: string }) {
  return <label className="block text-sm font-bold">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal" /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal" />}</label>;
}

