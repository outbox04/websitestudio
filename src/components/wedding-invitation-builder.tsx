"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Heart,
  ImagePlus,
  MapPin,
  Music,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";

type InvitationForm = {
  groomName: string;
  brideName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  welcomeMessage: string;
  story: string;
  dressCode: string;
  musicTitle: string;
  rsvpPhone: string;
  rsvpDeadline: string;
  theme: "rose" | "blue" | "champagne";
  showTimeline: boolean;
  showGuestBook: boolean;
};

const defaultForm: InvitationForm = {
  groomName: "Minh Anh",
  brideName: "Hoai Thu",
  eventDate: "2026-11-21",
  eventTime: "17:30",
  venueName: "White Palace Pham Van Dong",
  venueAddress: "108 Pham Van Dong, Thu Duc, TP. Ho Chi Minh",
  welcomeMessage: "Tran trong moi ban den chung vui trong ngay hanh phuc cua chung toi.",
  story: "Tu mot buoi ca phe nho, chung toi da tim thay nguoi muon nam tay di qua nhung mua yeu thuong.",
  dressCode: "Trang, hong phan, be champagne",
  musicTitle: "Perfect - Ed Sheeran",
  rsvpPhone: "0901 234 567",
  rsvpDeadline: "2026-11-10",
  theme: "rose",
  showTimeline: true,
  showGuestBook: true,
};

const themes = {
  rose: {
    name: "Rose",
    accent: "#EB2F96",
    accentDark: "#C41D7F",
    tint: "#FFF0F6",
    soft: "#FFF7FA",
    ink: "#161515",
  },
  blue: {
    name: "Blue",
    accent: "#1677FF",
    accentDark: "#0958D9",
    tint: "#E6F4FF",
    soft: "#F7FBFF",
    ink: "#161515",
  },
  champagne: {
    name: "Champagne",
    accent: "#B8894D",
    accentDark: "#8B6332",
    tint: "#FFF6E8",
    soft: "#FFFCF7",
    ink: "#161515",
  },
} satisfies Record<InvitationForm["theme"], Record<string, string>>;

const timeline = [
  ["16:30", "Don khach"],
  ["17:30", "Le thanh hon"],
  ["18:15", "Khai tiec"],
  ["20:00", "Chup anh cung co dau chu re"],
];

function formatDisplayDate(value: string) {
  if (!value) return "Chon ngay cuoi";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function fieldId(name: keyof InvitationForm) {
  return `wedding-${name}`;
}

export function WeddingInvitationBuilder({ studioName }: { studioName: string }) {
  const [form, setForm] = useState<InvitationForm>(defaultForm);
  const [coverUrl, setCoverUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState(false);
  const theme = themes[form.theme];
  const config = useMemo(() => ({ studioName, invitation: form, coverImage: coverUrl }), [coverUrl, form, studioName]);

  function update<K extends keyof InvitationForm>(key: K, value: InvitationForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setCreated(false);
  }

  function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setCoverUrl(URL.createObjectURL(file));
    setCreated(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreated(true);
  }

  async function copyConfig() {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="min-h-screen bg-[#fff7fa] text-[#333333]">
      <div className="border-b border-[#E5E7EB] bg-white/95 px-4 py-4 shadow-[0_2px_4px_rgba(175,182,201,0.16)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#EB2F96]">{studioName}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-[#161515] sm:text-3xl">Tao thiep cuoi online</h1>
          </div>
          <button
            type="button"
            onClick={copyConfig}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#D9D9D9] bg-white px-4 text-sm font-semibold text-[#333333] shadow-[0_2px_0_rgba(0,0,0,0.02)] transition hover:border-[#1677FF] hover:text-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#BAE0FF]"
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Da copy cau hinh" : "Copy cau hinh"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:py-8">
        <form onSubmit={submit} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:p-6">
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFF0F6] text-[#EB2F96]">
              <Heart size={19} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#161515]">Thong tin chinh</h2>
              <p className="text-sm leading-6 text-[#666666]">Nhap noi dung can xuat hien tren thiep moi.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Ten chu re" name="groomName" value={form.groomName} onChange={(value) => update("groomName", value)} required />
            <TextField label="Ten co dau" name="brideName" value={form.brideName} onChange={(value) => update("brideName", value)} required />
            <TextField label="Ngay cuoi" name="eventDate" type="date" value={form.eventDate} onChange={(value) => update("eventDate", value)} required />
            <TextField label="Gio don khach" name="eventTime" type="time" value={form.eventTime} onChange={(value) => update("eventTime", value)} required />
            <TextField label="Ten sanh / nha hang" name="venueName" value={form.venueName} onChange={(value) => update("venueName", value)} required />
            <TextField label="Dien thoai RSVP" name="rsvpPhone" value={form.rsvpPhone} onChange={(value) => update("rsvpPhone", value)} inputMode="tel" />
            <div className="sm:col-span-2">
              <TextField label="Dia chi tiec" name="venueAddress" value={form.venueAddress} onChange={(value) => update("venueAddress", value)} required />
            </div>
            <TextArea label="Loi moi" name="welcomeMessage" value={form.welcomeMessage} onChange={(value) => update("welcomeMessage", value)} />
            <TextArea label="Cau chuyen ngan" name="story" value={form.story} onChange={(value) => update("story", value)} />
            <TextField label="Dress code" name="dressCode" value={form.dressCode} onChange={(value) => update("dressCode", value)} />
            <TextField label="Nhac nen" name="musicTitle" value={form.musicTitle} onChange={(value) => update("musicTitle", value)} />
            <TextField label="Han RSVP" name="rsvpDeadline" type="date" value={form.rsvpDeadline} onChange={(value) => update("rsvpDeadline", value)} />
            <label className="block text-sm font-semibold text-[#333333]">
              Anh bia
              <span className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#D9D9D9] bg-[#F5F5F5] px-3 text-sm font-normal text-[#666666] transition hover:border-[#1677FF] hover:text-[#1677FF]">
                <ImagePlus size={17} />
                Tai anh cap doi
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={uploadCover} />
            </label>
          </div>

          <div className="mt-6 border-t border-[#E5E7EB] pt-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#161515]">
              <Palette size={17} />
              Mau giao dien
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(Object.keys(themes) as InvitationForm["theme"][]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => update("theme", key)}
                  className="min-h-11 rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BAE0FF]"
                  style={{
                    borderColor: form.theme === key ? themes[key].accent : "#D9D9D9",
                    background: form.theme === key ? themes[key].tint : "#FFFFFF",
                    color: form.theme === key ? themes[key].accentDark : "#333333",
                  }}
                >
                  {themes[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Toggle label="Hien timeline" checked={form.showTimeline} onChange={(value) => update("showTimeline", value)} />
            <Toggle label="Hien so luu niem" checked={form.showGuestBook} onChange={(value) => update("showGuestBook", value)} />
          </div>

          {created && (
            <div className="mt-5 rounded-md border border-[#B7EB8F] bg-[#F6FFED] p-3 text-sm font-semibold text-[#389E0D]">
              Da tao ban nhap thiep. Ban co the copy cau hinh de luu hoac ket noi API luu thiep o buoc tiep theo.
            </div>
          )}

          <button
            type="submit"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#EB2F96] px-5 text-sm font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.02)] transition hover:bg-[#C41D7F] focus:outline-none focus:ring-2 focus:ring-[#BAE0FF]"
          >
            <Sparkles size={17} />
            Tao ban nhap thiep
          </button>
        </form>

        <section className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                  Preview
                </p>
                <h2 className="text-lg font-bold text-[#161515]">Thiep moi khach</h2>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: theme.accent, color: theme.accentDark, background: theme.tint }}>
                {theme.name}
              </span>
            </div>

            <article className="overflow-hidden rounded-lg border border-[#E5E7EB]" style={{ background: theme.soft }}>
              <div className="relative min-h-[320px] bg-[#E5E7EB]">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Object URLs from local uploads cannot be optimized by next/image.
                  <img src={coverUrl} alt="Anh bia thiep cuoi" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,.72), rgba(255,255,255,.18)), radial-gradient(circle at 30% 30%, rgba(235,47,150,.22), transparent 32%), linear-gradient(145deg, #f8dce8, #d9e8ff 55%, #fff4df)",
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-white/15" />
                <div className="relative flex min-h-[320px] flex-col justify-end p-6 text-white sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">Save the date</p>
                  <h3 className="mt-4 text-4xl font-normal leading-tight sm:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {form.groomName || "Chu re"} & {form.brideName || "Co dau"}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-6 text-white/90">{form.welcomeMessage}</p>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <PreviewItem icon={<Calendar size={17} />} label="Ngay cuoi" value={formatDisplayDate(form.eventDate)} color={theme.accent} />
                <PreviewItem icon={<Clock size={17} />} label="Thoi gian" value={form.eventTime || "17:30"} color={theme.accent} />
                <PreviewItem icon={<MapPin size={17} />} label="Dia diem" value={`${form.venueName}\n${form.venueAddress}`} color={theme.accent} />
                <PreviewItem icon={<Users size={17} />} label="RSVP" value={`${form.rsvpPhone}\nTruoc ${formatDisplayDate(form.rsvpDeadline)}`} color={theme.accent} />
              </div>

              <div className="border-t border-[#E5E7EB] px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                  Chuyen tinh yeu
                </p>
                <p className="mt-2 text-sm leading-7 text-[#333333]">{form.story}</p>
              </div>

              <div className="grid gap-3 border-t border-[#E5E7EB] p-5 sm:grid-cols-2 sm:p-6">
                <PreviewPill icon={<Heart size={16} />} label={form.dressCode || "Dress code"} color={theme.accent} background={theme.tint} />
                <PreviewPill icon={<Music size={16} />} label={form.musicTitle || "Nhac nen"} color={theme.accent} background={theme.tint} />
              </div>

              {form.showTimeline && (
                <div className="border-t border-[#E5E7EB] p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                    Lich trinh
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {timeline.map(([time, label]) => (
                      <div key={time} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-3">
                        <p className="text-sm font-bold text-[#161515]">{time}</p>
                        <p className="mt-1 text-sm text-[#666666]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.showGuestBook && (
                <div className="border-t border-[#E5E7EB] bg-white p-5 text-center sm:p-6">
                  <p className="text-lg font-bold text-[#161515]">Hen gap ban trong ngay vui cua chung toi</p>
                  <button type="button" className="mt-4 min-h-11 rounded-md px-5 text-sm font-semibold text-white" style={{ background: theme.accent }}>
                    Gui loi chuc
                  </button>
                </div>
              )}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  inputMode,
}: {
  label: string;
  name: keyof InvitationForm;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "tel" | "text" | "email" | "numeric";
}) {
  return (
    <label htmlFor={fieldId(name)} className="block text-sm font-semibold text-[#333333]">
      {label}
      <input
        id={fieldId(name)}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        inputMode={inputMode}
        className="mt-2 min-h-11 w-full rounded border border-[#E0E0E0] bg-white px-3 text-sm font-normal leading-6 text-[#333333] outline-none transition placeholder:text-[#BFBFBF] focus:border-[#1677FF] focus:ring-2 focus:ring-[#BAE0FF]"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: keyof InvitationForm;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={fieldId(name)} className="block text-sm font-semibold text-[#333333] sm:col-span-2">
      {label}
      <textarea
        id={fieldId(name)}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 w-full rounded border border-[#E0E0E0] bg-white p-3 text-sm font-normal leading-6 text-[#333333] outline-none transition placeholder:text-[#BFBFBF] focus:border-[#1677FF] focus:ring-2 focus:ring-[#BAE0FF]"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F5F5F5] px-3 text-sm font-semibold text-[#333333]">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-[#EB2F96]" />
    </label>
  );
}

function PreviewItem({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color }}>
        {icon}
        {label}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#333333]">{value}</p>
    </div>
  );
}

function PreviewPill({ icon, label, color, background }: { icon: ReactNode; label: string; color: string; background: string }) {
  return (
    <div className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold" style={{ borderColor: color, color, background }}>
      {icon}
      {label}
    </div>
  );
}
