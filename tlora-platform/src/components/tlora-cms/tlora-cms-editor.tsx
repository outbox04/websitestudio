"use client";

import { Check, Eye, Image as ImageIcon, Laptop, Loader2, Save, Send, Smartphone, Tablet, Type } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updateSectionSchema } from "@/schemas/tlora-cms";
import type { TloraCmsPage, TloraCmsSection } from "@/types/scope";

type Device = "desktop" | "tablet" | "mobile";
type EditableContent = Record<string, unknown> & { title?: string; description?: string; image?: string; ctaLabel?: string; ctaHref?: string };

const deviceWidth: Record<Device, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

export function TloraCmsEditor({
  studioName,
  initialPage,
  initialSections,
}: {
  studioName: string;
  initialPage: TloraCmsPage;
  initialSections: TloraCmsSection[];
}) {
  const [sections, setSections] = useState(initialSections);
  const [selectedId, setSelectedId] = useState(initialSections[0]?.id || "");
  const [device, setDevice] = useState<Device>("desktop");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const previewRef = useRef<HTMLIFrameElement>(null);
  const selected = useMemo(() => sections.find((section) => section.id === selectedId) || sections[0], [sections, selectedId]);

  const syncPreview = useCallback(() => {
    previewRef.current?.contentWindow?.postMessage({
      type: "tlora:cms-preview",
      sections: sections.map((section) => ({
        sectionKey: section.sectionKey,
        isEnabled: section.isEnabled,
        draftContent: section.draftContent,
      })),
    }, window.location.origin);
  }, [sections]);

  useEffect(() => {
    syncPreview();
  }, [syncPreview]);

  useEffect(() => {
    function handleReady(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string } | null;
      if (message?.type === "tlora:cms-preview-ready") syncPreview();
    }

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [syncPreview]);

  function updateSelected(patch: Partial<EditableContent>) {
    if (!selected) return;
    setSections((current) => current.map((section) => section.id === selected.id
      ? { ...section, draftContent: { ...section.draftContent, ...patch } }
      : section));
  }

  async function saveSection() {
    if (!selected) return;
    setBusy("save");
    setMessage("");
    const payload = {
      sectionId: selected.id,
      sectionType: selected.sectionType,
      content: selected.draftContent,
      isEnabled: selected.isEnabled,
    };
    const parsed = updateSectionSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Nội dung không hợp lệ.");
      setBusy("");
      return;
    }
    try {
      const response = await fetch("/api/admin/tlora/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json() as { section?: TloraCmsSection; error?: string };
      if (!response.ok || !result.section) throw new Error(result.error || "Không thể lưu bản nháp.");
      setSections((current) => current.map((section) => section.id === result.section?.id ? result.section : section));
      setMessage("Đã lưu bản nháp. Website công khai chưa thay đổi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu bản nháp.");
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    setBusy("publish");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tlora/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: initialPage.id, changeNote: "Xuất bản từ TLORA CMS" }),
      });
      const result = await response.json() as { published?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "Không thể xuất bản.");
      setMessage("Website TLORA đã được xuất bản và tạo một phiên bản khôi phục.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xuất bản.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f8f5ee]">
      <header className="flex flex-col justify-between gap-4 border-b border-[#2a2722] bg-[#101115] px-5 py-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">First-party CMS · {studioName}</p>
          <h1 className="mt-1 text-2xl font-extrabold">Trang chủ TLORA</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#cbc0b0]">{initialPage.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span>
          <button type="button" onClick={saveSection} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold text-[#f8f5ee] disabled:opacity-50">
            {busy === "save" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Lưu bản nháp
          </button>
          <button type="button" onClick={publish} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-50">
            {busy === "publish" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Xuất bản
          </button>
        </div>
      </header>

      {message && <div className={`border-b px-5 py-3 text-sm font-semibold ${message.startsWith("Đã") || message.startsWith("Website") ? "border-emerald-900 bg-emerald-950/40 text-emerald-300" : "border-red-900 bg-red-950/40 text-red-300"}`}>{message}</div>}

      <div className="grid min-h-[calc(100vh-73px)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-r border-[#2a2722] bg-[#101115] p-4">
          <p className="px-2 text-xs font-bold uppercase tracking-[.14em] text-[#8c8174]">Section được phép</p>
          <nav className="mt-3 space-y-1">
            {sections.map((section) => (
              <button key={section.id} type="button" onClick={() => setSelectedId(section.id)} className={`flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm font-bold ${selected?.id === section.id ? "bg-[#d8b766] text-[#07080a]" : "text-[#cbc0b0] hover:bg-white/[.05]"}`}>
                <span className="flex items-center gap-2">{section.sectionType === "gallery" ? <ImageIcon size={16} /> : <Type size={16} />}{section.sectionKey}</span>
                {section.isEnabled && <Check size={14} />}
              </button>
            ))}
          </nav>

          {selected && (
            <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
              <label className="flex items-center justify-between gap-3 text-sm font-bold">
                Hiển thị section
                <input type="checkbox" checked={selected.isEnabled} onChange={(event) => setSections((current) => current.map((section) => section.id === selected.id ? { ...section, isEnabled: event.target.checked } : section))} />
              </label>
              <CmsField label="Tiêu đề" value={String(selected.draftContent.title || "")} onChange={(title) => updateSelected({ title })} />
              {"description" in selected.draftContent && <CmsField label="Mô tả" value={String(selected.draftContent.description || "")} onChange={(description) => updateSelected({ description })} textarea />}
              {"image" in selected.draftContent && <CmsField label="Ảnh HTTPS / thư viện" value={String(selected.draftContent.image || "")} onChange={(image) => updateSelected({ image })} />}
              {"ctaLabel" in selected.draftContent && <CmsField label="Nhãn CTA" value={String(selected.draftContent.ctaLabel || "")} onChange={(ctaLabel) => updateSelected({ ctaLabel })} />}
              {"ctaHref" in selected.draftContent && <CmsField label="Liên kết CTA" value={String(selected.draftContent.ctaHref || "")} onChange={(ctaHref) => updateSelected({ ctaHref })} />}
              <p className="rounded-md border border-white/10 bg-[#14110f] p-3 text-xs leading-5 text-[#8c8174]">Cấu trúc, CSS, responsive và JavaScript bị khóa. Admin chỉ sửa nội dung trong schema đã cho phép.</p>
            </div>
          )}
        </aside>

        <section className="min-w-0 bg-[#14110f] p-4 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#cbc0b0]"><Eye size={17} /> Live Preview bản nháp</div>
            <div className="flex rounded-md border border-white/10 bg-[#07080a] p-1">
              {(["desktop", "tablet", "mobile"] as Device[]).map((item) => {
                const Icon = item === "desktop" ? Laptop : item === "tablet" ? Tablet : Smartphone;
                return <button key={item} type="button" onClick={() => setDevice(item)} aria-label={`Preview ${item}`} className={`grid size-9 place-items-center rounded ${device === item ? "bg-[#d8b766] text-[#07080a]" : "text-[#8c8174]"}`}><Icon size={17} /></button>;
              })}
            </div>
          </div>
          <div className="mx-auto min-h-[760px] overflow-hidden rounded-xl border border-[#2a2722] bg-[#f8f5ee] text-[#07080a] shadow-2xl transition-[width]" style={{ width: deviceWidth[device], maxWidth: "100%" }}>
            <iframe
              ref={previewRef}
              src="/?cmsPreview=1"
              title="Live Preview website TLORA"
              onLoad={syncPreview}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              className="h-[760px] w-full border-0 bg-[#14110f]"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function CmsField({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  const className = "mt-2 w-full rounded-md border border-white/10 bg-[#07080a] px-3 py-2 text-sm font-normal text-[#f8f5ee] outline-none focus:border-[#d8b766]";
  return <label className="block text-sm font-bold text-[#cbc0b0]">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${className} min-h-24`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}
