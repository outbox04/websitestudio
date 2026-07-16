"use client";

import { ImagePlus, Loader2, Save, Settings2 } from "lucide-react";
import { useRef, useState } from "react";
import { SiteAdvancedSettings } from "@/components/admin/site-advanced-settings";
import { ThemeContentEditor } from "@/components/admin/theme-content-editor";

type Props = { mode: "builder" | "settings"; studioSettings?: Record<string, unknown>; studioSlug?: string };
type Form = {
  logo_url: string;
  site_description: string;
  og_image_url: string;
  primary_color: string;
  accent_color: string;
  hero_title: string;
  hero_description: string;
  hero_image_url: string;
  facebook_url: string;
  zalo_phone: string;
};

export function StudioSiteBuilder({ mode, studioSettings = {}, studioSlug }: Props) {
  const setting = (key: string) => String(studioSettings[key] || "");
  const [form, setForm] = useState<Form>({
    logo_url: setting("logo_url"),
    site_description: setting("site_description"),
    og_image_url: setting("og_image_url"),
    primary_color: setting("primary_color") || "#0d0a08",
    accent_color: setting("accent_color") || "#c99a5e",
    hero_title: setting("hero_title") || "Lưu giữ cá tính qua từng khung hình nghệ thuật",
    hero_description: setting("hero_description") || "Một không gian nhiếp ảnh được thiết kế theo câu chuyện và cá tính riêng của bạn.",
    hero_image_url: setting("hero_image_url"),
    facebook_url: setting("facebook_url"),
    zalo_phone: setting("zalo_phone"),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const uploadInput = useRef<HTMLInputElement>(null);
  const [uploadKey, setUploadKey] = useState<keyof Form | null>(null);

  const set = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function readImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (uploadKey) set(uploadKey, String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/studio-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioSlug, settings: form }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể lưu cài đặt.");
      setMessage("Đã lưu và đồng bộ với website studio.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  }

  const imageInput = (label: string, key: keyof Form, helper?: string) => (
    <label className="block text-sm font-semibold text-zinc-800">
      {label}
      <div className="mt-2 flex gap-2">
        <input
          value={form[key]}
          onChange={(event) => set(key, event.target.value)}
          placeholder="Dán link ảnh hoặc tải ảnh lên"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-zinc-950"
        />
        <button
          type="button"
          onClick={() => {
            setUploadKey(key);
            uploadInput.current?.click();
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-300 px-3 text-xs font-bold hover:bg-zinc-50"
        >
          <ImagePlus size={15} />
          Tải ảnh
        </button>
      </div>
      {helper && <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{helper}</span>}
    </label>
  );

  if (mode === "builder") {
    return (
      <div className="max-w-[1500px] space-y-5">
        <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a57f2c]">Nội dung website</p>
          <h1 className="mt-2 text-3xl font-extrabold text-zinc-950">Trình biên tập trực quan</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            Chỉnh trực tiếp trên live preview thật của website studio. Bấm vào khu vực trong preview để sửa nội dung và hình ảnh.
          </p>
        </header>
        <ThemeContentEditor saved={studioSettings.site_content as never} settings={studioSettings} studioSlug={studioSlug} pageKey="trang-chu" pageLabel="Trang chủ" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5">
      <input
        ref={uploadInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) readImage(file);
          event.currentTarget.value = "";
        }}
      />
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a57f2c]">Tùy biến website</p>
        <h1 className="mt-2 text-3xl font-extrabold text-zinc-950">Thương hiệu & hiển thị</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
          Những thông tin nền tảng giúp website, chia sẻ Facebook/Zalo và kết quả tìm kiếm hiển thị đúng thương hiệu của bạn.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-6">
          <div className="flex items-start gap-3 rounded-lg bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            <Settings2 className="mt-0.5 shrink-0" size={18} />
            <p>
              <b>Ảnh bìa OG 16:9</b> là ảnh xuất hiện khi khách chia sẻ link website trên Facebook, Zalo, Messenger. Dùng ảnh ngang 1200 x 630 px, có logo/chủ thể rõ và ít chữ để hiển thị đẹp.
            </p>
          </div>
          {imageInput("Logo studio", "logo_url", "Dán link logo PNG/SVG nền trong suốt để thay logo trên website.")}
          <label className="block text-sm font-semibold text-zinc-800">
            Mô tả website
            <textarea value={form.site_description} onChange={(event) => set("site_description", event.target.value)} maxLength={160} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal" />
            <span className="mt-1 block text-xs font-normal text-zinc-500">{form.site_description.length}/160 ký tự - độ dài phù hợp cho mô tả Google và OG.</span>
          </label>
          {imageInput("Ảnh bìa OG 16:9", "og_image_url")}
          <div className="grid gap-5 border-t border-zinc-100 pt-6 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-zinc-800">
              Facebook
              <input value={form.facebook_url} onChange={(event) => set("facebook_url", event.target.value)} placeholder="https://facebook.com/..." className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-zinc-800">
              Zalo liên hệ
              <input value={form.zalo_phone} onChange={(event) => set("zalo_phone", event.target.value.replace(/[^0-9+]/g, ""))} placeholder="0901234567" className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal" />
            </label>
          </div>
        </div>
      </section>

      <SiteAdvancedSettings saved={studioSettings as Record<string, string | boolean | undefined>} />

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white disabled:opacity-60">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Đang lưu..." : "Lưu & đồng bộ website"}
        </button>
        {message && <p className={message.startsWith("Đã") ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>{message}</p>}
      </div>
    </div>
  );
}
