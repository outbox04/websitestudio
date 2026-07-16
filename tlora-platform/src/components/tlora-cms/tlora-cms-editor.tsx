"use client";

import { Eye, Laptop, Loader2, Save, Send, Share2, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TloraImagePicker, type ImageTarget } from "@/components/tlora-cms/tlora-image-picker";
import { updateSectionSchema } from "@/schemas/tlora-cms";
import type { TloraCmsMediaAsset, TloraCmsPage, TloraCmsSection } from "@/types/scope";

type Device = "desktop" | "tablet" | "mobile";
const deviceWidth: Record<Device, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

function normalizedPreviewPath(pathname: string) {
  if (pathname.startsWith("/tin-tuc/")) return "/tin-tuc";
  return pathname || "/";
}

export function TloraCmsEditor({
  studioName,
  initialPage,
  initialPages,
  initialSections,
  initialMedia,
}: {
  studioName: string;
  initialPage: TloraCmsPage;
  initialPages: TloraCmsPage[];
  initialSections: TloraCmsSection[];
  initialMedia: TloraCmsMediaAsset[];
}) {
  const [sections, setSections] = useState(initialSections);
  const [media, setMedia] = useState(initialMedia);
  const [imageTarget, setImageTarget] = useState<ImageTarget | null>(null);
  const [pageMetas, setPageMetas] = useState(() => Object.fromEntries(initialPages.map((page) => [page.id, {
    seoTitle: page.seoTitle, seoDescription: page.seoDescription, ogImageUrl: page.ogImageUrl,
  }])));
  const [previewPath, setPreviewPath] = useState("/");
  const [device, setDevice] = useState<Device>("desktop");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const previewRef = useRef<HTMLIFrameElement>(null);
  const currentPage = initialPages.find((page) => page.slug === normalizedPreviewPath(previewPath)) || initialPage;
  const meta = pageMetas[currentPage.id] || { seoTitle: "", seoDescription: "", ogImageUrl: "" };

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
      const previewMessage = event.data as { type?: string; sectionKey?: string; field?: string; value?: string; currentUrl?: string; pathname?: string } | null;
      if (previewMessage?.type === "tlora:cms-preview-ready") {
        if (previewMessage.pathname) setPreviewPath(previewMessage.pathname);
        syncPreview();
        return;
      }
      if (
        previewMessage?.type === "tlora:cms-preview-change"
        && previewMessage.sectionKey
        && previewMessage.field
        && typeof previewMessage.value === "string"
      ) {
        updateSectionField(previewMessage.sectionKey, previewMessage.field, previewMessage.value);
      }
      if (
        previewMessage?.type === "tlora:cms-preview-image-select"
        && previewMessage.sectionKey
        && previewMessage.field
      ) {
        setImageTarget({
          sectionKey: previewMessage.sectionKey,
          field: previewMessage.field,
          currentUrl: previewMessage.currentUrl || "",
        });
      }
    }

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [syncPreview]);

  function updateSectionField(sectionKey: string, field: string, value: string) {
    setSections((current) => current.map((section) => {
      if (section.sectionKey !== sectionKey) return section;
      if (field.startsWith("text.")) {
        const key = field.slice(5);
        const text = (section.draftContent.text || {}) as Record<string, unknown>;
        return { ...section, draftContent: { ...section.draftContent, text: { ...text, [key]: value } } };
      }
      if (field.startsWith("images.")) {
        const key = field.slice(7);
        const images = (section.draftContent.images || {}) as Record<string, unknown>;
        return { ...section, draftContent: { ...section.draftContent, images: { ...images, [key]: value } } };
      }
      return { ...section, draftContent: { ...section.draftContent, [field]: value } };
    }));
  }

  function applyImage(url: string) {
    if (!imageTarget) return;
    if (imageTarget.sectionKey === "__meta") {
      setPageMetas((current) => ({ ...current, [currentPage.id]: { ...meta, ogImageUrl: url } }));
    } else {
      updateSectionField(imageTarget.sectionKey, imageTarget.field, url);
    }
    setImageTarget(null);
  }

  async function persistDraft() {
    const sectionPayloads = sections.map((section) => updateSectionSchema.parse({
      sectionId: section.id,
      sectionType: section.sectionType,
      content: section.draftContent,
      isEnabled: section.isEnabled,
    }));
    const responses = await Promise.all([
      ...sectionPayloads.map((payload) => fetch("/api/admin/tlora/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })),
      ...initialPages.map((page) => fetch("/api/admin/tlora/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: page.id, ...(pageMetas[page.id] || { seoTitle: "", seoDescription: "", ogImageUrl: "" }) }),
      })),
    ]);
    const failed = responses.find((response) => !response.ok);
    if (failed) {
      const result = await failed.json() as { error?: string };
      throw new Error(result.error || "Không thể lưu bản nháp.");
    }
  }

  async function saveDraft() {
    setBusy("save");
    setMessage("");
    try {
      await persistDraft();
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
      await persistDraft();
      const response = await fetch("/api/admin/tlora/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: initialPage.id, changeNote: "Xuất bản từ TLORA CMS" }),
      });
      const result = await response.json() as { published?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "Không thể xuất bản.");
      if (currentPage.id !== initialPage.id) {
        const metaResponse = await fetch("/api/admin/tlora/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: currentPage.id, changeNote: "Xuất bản metadata trang" }),
        });
        if (!metaResponse.ok) throw new Error("Không thể xuất bản metadata của trang hiện tại.");
      }
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
          <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#cbc0b0]">{currentPage.title} · {currentPage.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span>
          <button type="button" onClick={saveDraft} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold text-[#f8f5ee] disabled:opacity-50">
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
          <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">
            <Share2 size={15} /> OG Meta Tag
          </div>
          <p className="mt-3 px-2 text-xs leading-5 text-[#8c8174]">Thông tin hiển thị khi chia sẻ trang chủ lên Facebook, Zalo và các nền tảng mạng xã hội.</p>
          <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
            <CmsField label="OG title" value={meta.seoTitle} onChange={(seoTitle) => setPageMetas((current) => ({ ...current, [currentPage.id]: { ...meta, seoTitle } }))} />
            <div>
              <CmsField label="OG description" value={meta.seoDescription} onChange={(seoDescription) => setPageMetas((current) => ({ ...current, [currentPage.id]: { ...meta, seoDescription } }))} textarea />
              <p className="mt-1 text-right text-[11px] text-[#8c8174]">{meta.seoDescription.length}/200</p>
            </div>
            <CmsField label="OG image URL" value={meta.ogImageUrl} onChange={(ogImageUrl) => setPageMetas((current) => ({ ...current, [currentPage.id]: { ...meta, ogImageUrl } }))} />
            <button type="button" onClick={() => setImageTarget({ sectionKey: "__meta", field: "ogImageUrl", currentUrl: meta.ogImageUrl })} className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/15 text-sm font-bold text-[#cbc0b0] hover:border-[#d8b766] hover:text-[#f8f5ee]">Chọn ảnh OG từ thư viện</button>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#07080a]">
            <div className="aspect-[1.91/1] bg-[#1c1813] bg-cover bg-center" style={meta.ogImageUrl ? { backgroundImage: `url(${meta.ogImageUrl})` } : undefined} />
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-bold text-[#f8f5ee]">{meta.seoTitle || "TLORA Studio"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8c8174]">{meta.seoDescription || "Mô tả trang chủ khi được chia sẻ."}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[.08em] text-[#cbc0b0]">tlgroup.site</p>
            </div>
          </div>

          <p className="mt-5 rounded-md border border-[#d8b766]/20 bg-[#d8b766]/[.06] p-3 text-xs leading-5 text-[#cbc0b0]">
            Nhấp trực tiếp vào chữ trong Live Preview để sửa. Nhấp đúp ảnh hoặc nút CTA để đổi URL.
          </p>
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
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              className="h-[760px] w-full border-0 bg-[#14110f]"
            />
          </div>
        </section>
      </div>
      {imageTarget && (
        <TloraImagePicker
          target={imageTarget}
          assets={media}
          onClose={() => setImageTarget(null)}
          onApply={applyImage}
          onUploaded={(asset) => setMedia((current) => [asset, ...current])}
        />
      )}
    </div>
  );
}

function CmsField({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  const className = "mt-2 w-full rounded-md border border-white/10 bg-[#07080a] px-3 py-2 text-sm font-normal text-[#f8f5ee] outline-none focus:border-[#d8b766]";
  return <label className="block text-sm font-bold text-[#cbc0b0]">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${className} min-h-24`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}
