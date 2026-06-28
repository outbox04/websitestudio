"use client";

import { ImagePlus, Laptop, Loader2, MonitorSmartphone, RefreshCw, Save, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Item = { title: string; subtitle: string; description: string; image: string; price: string; features: string };
type Content = {
  hero: { title: string; description: string; image: string; cta: string };
  about: { title: string; description: string; image: string };
  services: Item[];
  pricing: Item[];
  gallery: Item[];
};
type Contact = { logo_url: string; phone: string; email: string; address: string; facebook_url: string; zalo_phone: string };
type SelectionType = "brand" | "hero" | "about" | "services" | "pricing" | "gallery" | "contact";
type Selection = { type: SelectionType; index?: number };
type Device = "desktop" | "tablet" | "mobile";
type PanelKey = "title" | "description" | "image" | "cta";

const deviceWidths: Record<Device, string> = { desktop: "100%", tablet: "820px", mobile: "390px" };
const pageDefaults: Record<string, Selection> = {
  "trang-chu": { type: "hero" },
  "gioi-thieu": { type: "about" },
  "dich-vu": { type: "services", index: 0 },
  album: { type: "gallery", index: 0 },
  "bang-gia": { type: "pricing", index: 0 },
  "lien-he": { type: "contact" },
};

const mojibakePattern = /(?:Ã|Â|Ä|Å|Æ|áº|á»|â€|Â|à¸|à¹)/;

function fixMojibake(value: string) {
  if (!mojibakePattern.test(value)) return value;
  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return decoded.includes("�") ? value : decoded;
  } catch {
    return value;
  }
}

function fixItem(item: Item): Item {
  return {
    title: fixMojibake(item.title || ""),
    subtitle: fixMojibake(item.subtitle || ""),
    description: fixMojibake(item.description || ""),
    image: item.image || "",
    price: fixMojibake(item.price || ""),
    features: fixMojibake(item.features || ""),
  };
}

const emptyItem = (title = "Mục mới"): Item => ({
  title,
  subtitle: "Danh mục",
  description: "Nhập mô tả ngắn cho mục này.",
  image: "",
  price: "Liên hệ",
  features: "",
});

const initialContent: Content = {
  hero: {
    title: "Câu chuyện của studio bắt đầu từ đây",
    description: "Thay câu chữ và hình ảnh để website thể hiện đúng phong cách studio của bạn.",
    image: "",
    cta: "Đặt lịch tư vấn",
  },
  about: { title: "Về studio", description: "Giới thiệu ngắn về phong cách, đội ngũ và trải nghiệm khách hàng.", image: "" },
  services: [emptyItem("Dịch vụ 1"), emptyItem("Dịch vụ 2"), emptyItem("Dịch vụ 3")],
  pricing: [emptyItem("Gói cơ bản"), emptyItem("Gói phổ biến"), emptyItem("Gói cao cấp")],
  gallery: [emptyItem("Album 1"), emptyItem("Album 2"), emptyItem("Album 3")],
};

function normalizeContent(saved?: Partial<Content>): Content {
  return {
    ...initialContent,
    ...saved,
    hero: {
      ...initialContent.hero,
      ...saved?.hero,
      title: fixMojibake(saved?.hero?.title || initialContent.hero.title),
      description: fixMojibake(saved?.hero?.description || initialContent.hero.description),
      cta: fixMojibake(saved?.hero?.cta || initialContent.hero.cta),
    },
    about: {
      ...initialContent.about,
      ...saved?.about,
      title: fixMojibake(saved?.about?.title || initialContent.about.title),
      description: fixMojibake(saved?.about?.description || initialContent.about.description),
    },
    services: saved?.services?.length ? saved.services.map(fixItem) : initialContent.services,
    pricing: saved?.pricing?.length ? saved.pricing.map(fixItem) : initialContent.pricing,
    gallery: saved?.gallery?.length ? saved.gallery.map(fixItem) : initialContent.gallery,
  };
}

function normalizeContact(settings?: Record<string, unknown>): Contact {
  return {
    logo_url: String(settings?.logo_url || ""),
    phone: fixMojibake(String(settings?.phone || "")),
    email: String(settings?.email || ""),
    address: fixMojibake(String(settings?.address || "")),
    facebook_url: String(settings?.facebook_url || ""),
    zalo_phone: String(settings?.zalo_phone || ""),
  };
}

function parseSelection(value: string): Selection | null {
  const [type, rawIndex] = value.split(":");
  if (!["brand", "hero", "about", "services", "pricing", "gallery", "contact"].includes(type)) return null;
  const index = rawIndex ? Number(rawIndex) : undefined;
  return { type: type as SelectionType, index: Number.isFinite(index) ? index : undefined };
}

function selectionKey(selection: Selection) {
  return `${selection.type}:${selection.index || 0}`;
}

export function ThemeContentEditor({
  saved,
  settings,
  studioSlug,
  pageKey,
  pageLabel,
}: {
  saved?: Partial<Content>;
  settings?: Record<string, unknown>;
  studioSlug?: string;
  pageKey?: string;
  pageLabel?: string;
}) {
  const [content, setContent] = useState<Content>(() => normalizeContent(saved));
  const [contact, setContact] = useState<Contact>(() => normalizeContact(settings));
  const [selected, setSelected] = useState<Selection>(() => pageDefaults[pageKey || "trang-chu"] || { type: "hero" });
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [frameReady, setFrameReady] = useState(false);
  const [frameNonce, setFrameNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<Selection>({ type: "hero" });

  const activePageKey = pageKey || "trang-chu";
  const activePageLabel = pageLabel || "Trang chủ";
  const previewPath = activePageKey === "trang-chu" ? "" : `/${activePageKey}`;
  const previewSrc = `/studio-site/${studioSlug}/theme${previewPath}?builder=1&v=${frameNonce}`;

  const activeItem = selected.type === "services" || selected.type === "pricing" || selected.type === "gallery"
    ? content[selected.type][selected.index || 0]
    : null;


  const pushPreview = useCallback((nextContent: Content, nextContact: Contact) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "tlora-builder-preview", content: nextContent, studio: nextContact, selected: selectionKey(selected) },
      window.location.origin
    );
  }, [selected]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || !event.data) return;
      if (event.data.type === "tlora-builder-ready") {
        setFrameReady(true);
        pushPreview(content, contact);
      }
      if (event.data.type === "tlora-builder-select" && typeof event.data.key === "string") {
        const next = parseSelection(event.data.key);
        if (next) setSelected(next);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [content, contact, pushPreview]);

  useEffect(() => {
    pushPreview(content, contact);
  }, [content, contact, frameReady, pushPreview]);

  function updateContent(target: Selection, key: keyof Item | keyof Content["hero"] | keyof Content["about"], value: string) {
    setContent((current) => {
      if (target.type === "hero" || target.type === "about") return { ...current, [target.type]: { ...current[target.type], [key]: value } };
      if (target.type === "services" || target.type === "pricing" || target.type === "gallery") {
        const index = target.index || 0;
        return { ...current, [target.type]: current[target.type].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) };
      }
      return current;
    });
  }

  function updateContact(key: keyof Contact, value: string) {
    setContact((current) => ({ ...current, [key]: value }));
  }

  function chooseImage(target: Selection) {
    uploadTarget.current = target;
    setSelected(target);
    uploadRef.current?.click();
  }

  function uploadImage(file: File) {
    const target = uploadTarget.current;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      if (target.type === "brand") updateContact("logo_url", value);
      else updateContent(target, "image", value);
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
        body: JSON.stringify({ studioSlug, settings: { ...contact, site_content: content } }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể lưu website.");
      setMessage("Đã lưu và đồng bộ website.");
      setFrameNonce((value) => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu website.");
    } finally {
      setSaving(false);
    }
  }

  const title = useMemo(() => {
    if (selected.type === "brand") return "Logo & nhận diện";
    if (selected.type === "hero") return "Hero trang chủ";
    if (selected.type === "about") return "Giới thiệu";
    if (selected.type === "services") return `Dịch vụ ${(selected.index || 0) + 1}`;
    if (selected.type === "pricing") return `Bảng giá ${(selected.index || 0) + 1}`;
    if (selected.type === "gallery") return `Album ${(selected.index || 0) + 1}`;
    return "Liên hệ";
  }, [selected]);

  if (!studioSlug) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        Mở trình sửa từ trang quản trị subdomain để xem live preview đúng website studio.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <input
        ref={uploadRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="grid min-h-[calc(100vh-210px)] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-200 bg-white p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#c99a5e]">Đang sửa</p>
              <h2 className="mt-1 text-xl font-extrabold text-zinc-950">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Bấm trực tiếp vào website bên phải để chọn khu vực cần sửa.</p>
            </div>
            <button type="button" onClick={() => setFrameNonce((value) => value + 1)} className="grid size-9 shrink-0 place-items-center rounded-md border border-zinc-300 text-zinc-700" title="Tải lại preview">
              <RefreshCw size={16} />
            </button>
          </div>

          <QuickNav selected={selected} onSelect={setSelected} content={content} />

          <div className="mt-5 space-y-4">
            {selected.type === "brand" && (
              <BrandFields contact={contact} update={updateContact} chooseLogo={() => chooseImage({ type: "brand" })} />
            )}
            {selected.type === "hero" && (
              <PanelFields
                values={content.hero}
                onChange={(key, value) => updateContent({ type: "hero" }, key, value)}
                onImage={() => chooseImage({ type: "hero" })}
                showCta
              />
            )}
            {selected.type === "about" && (
              <PanelFields values={content.about} onChange={(key, value) => updateContent({ type: "about" }, key, value)} onImage={() => chooseImage({ type: "about" })} />
            )}
            {activeItem && (selected.type === "services" || selected.type === "pricing" || selected.type === "gallery") && (
              <ItemFields
                item={activeItem}
                type={selected.type}
                onChange={(key, value) => updateContent(selected, key, value)}
                onImage={() => chooseImage(selected)}
              />
            )}
            {selected.type === "contact" && <ContactFields contact={contact} update={updateContact} />}
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4">
            <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {saving ? "Đang lưu..." : "Lưu website"}
            </button>
            {message && <p className={`mt-3 text-center text-xs font-bold ${message.startsWith("Đã") ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
          </div>
        </aside>

        <main className="min-w-0 bg-zinc-100 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <MonitorSmartphone size={17} />
              Live preview thật: {activePageLabel}
            </div>
            <div className="flex rounded-md border border-zinc-300 bg-white p-1">
              {(["desktop", "tablet", "mobile"] as Device[]).map((item) => {
                const Icon = item === "desktop" ? Laptop : item === "tablet" ? Tablet : Smartphone;
                return (
                  <button key={item} type="button" onClick={() => setDevice(item)} className={`grid size-9 place-items-center rounded ${device === item ? "bg-zinc-950 text-white" : "text-zinc-600"}`} title={item}>
                    <Icon size={17} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-auto h-[calc(100vh-270px)] min-h-[620px] overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-xl transition-all" style={{ width: deviceWidths[device] }}>
            <iframe
              ref={iframeRef}
              key={previewSrc}
              src={previewSrc}
              title={`Live preview ${activePageLabel}`}
              className="h-full w-full border-0"
              onLoad={() => {
                setFrameReady(true);
                pushPreview(content, contact);
              }}
            />
          </div>
        </main>
      </div>
    </section>
  );
}

function QuickNav({ selected, onSelect, content }: { selected: Selection; onSelect: (value: Selection) => void; content: Content }) {
  const groups: Array<{ label: string; value: Selection }> = [
    { label: "Logo", value: { type: "brand" } },
    { label: "Hero", value: { type: "hero" } },
    { label: "Giới thiệu", value: { type: "about" } },
    { label: "Liên hệ", value: { type: "contact" } },
  ];
  return (
    <div className="mt-5 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {groups.map((group) => <NavButton key={group.label} label={group.label} active={selectionKey(selected) === selectionKey(group.value)} onClick={() => onSelect(group.value)} />)}
      </div>
      <MiniList label="Dịch vụ" type="services" items={content.services} selected={selected} onSelect={onSelect} />
      <MiniList label="Bảng giá" type="pricing" items={content.pricing} selected={selected} onSelect={onSelect} />
      <MiniList label="Album" type="gallery" items={content.gallery} selected={selected} onSelect={onSelect} />
    </div>
  );
}

function NavButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-10 rounded-md px-3 text-left text-sm font-bold ${active ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}>{label}</button>;
}

function MiniList({ label, type, items, selected, onSelect }: { label: string; type: "services" | "pricing" | "gallery"; items: Item[]; selected: Selection; onSelect: (value: Selection) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-zinc-500">{label}</p>
      <div className="grid gap-1">
        {items.map((item, index) => (
          <button key={`${type}-${index}`} type="button" onClick={() => onSelect({ type, index })} className={`truncate rounded-md px-3 py-2 text-left text-xs font-semibold ${selected.type === type && selected.index === index ? "bg-sky-600 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}>
            {index + 1}. {item.title || label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BrandFields({ contact, update, chooseLogo }: { contact: Contact; update: (key: keyof Contact, value: string) => void; chooseLogo: () => void }) {
  return (
    <>
      <ImageField label="Logo studio" value={contact.logo_url} onChange={(value) => update("logo_url", value)} onImage={chooseLogo} />
      <Field label="Facebook" value={contact.facebook_url} onChange={(value) => update("facebook_url", value)} />
      <Field label="Zalo" value={contact.zalo_phone} onChange={(value) => update("zalo_phone", value.replace(/[^0-9+]/g, ""))} />
    </>
  );
}

function ContactFields({ contact, update }: { contact: Contact; update: (key: keyof Contact, value: string) => void }) {
  return (
    <>
      <Field label="Số điện thoại" value={contact.phone} onChange={(value) => update("phone", value)} />
      <Field label="Email" value={contact.email} onChange={(value) => update("email", value)} />
      <Field label="Địa chỉ" value={contact.address} onChange={(value) => update("address", value)} textarea />
      <Field label="Facebook" value={contact.facebook_url} onChange={(value) => update("facebook_url", value)} />
      <Field label="Zalo" value={contact.zalo_phone} onChange={(value) => update("zalo_phone", value.replace(/[^0-9+]/g, ""))} />
    </>
  );
}

function PanelFields({ values, onChange, onImage, showCta = false }: { values: { title: string; description: string; image: string; cta?: string }; onChange: (key: PanelKey, value: string) => void; onImage: () => void; showCta?: boolean }) {
  return (
    <>
      <Field label="Tiêu đề" value={values.title} onChange={(value) => onChange("title", value)} />
      <Field label="Mô tả" value={values.description} onChange={(value) => onChange("description", value)} textarea />
      {showCta && <Field label="Nút kêu gọi" value={values.cta || ""} onChange={(value) => onChange("cta", value)} />}
      <ImageField label="Hình ảnh" value={values.image} onChange={(value) => onChange("image", value)} onImage={onImage} />
    </>
  );
}

function ItemFields({ item, type, onChange, onImage }: { item: Item; type: "services" | "pricing" | "gallery"; onChange: (key: keyof Item, value: string) => void; onImage: () => void }) {
  return (
    <>
      <Field label="Tiêu đề" value={item.title} onChange={(value) => onChange("title", value)} />
      <Field label="Nhãn phụ" value={item.subtitle} onChange={(value) => onChange("subtitle", value)} />
      <Field label="Mô tả" value={item.description} onChange={(value) => onChange("description", value)} textarea />
      {type === "pricing" && <Field label="Giá" value={item.price} onChange={(value) => onChange("price", value)} />}
      {type !== "gallery" && <Field label="Điểm nổi bật" value={item.features} onChange={(value) => onChange("features", value)} textarea />}
      <ImageField label="Hình ảnh" value={item.image} onChange={(value) => onChange("image", value)} onImage={onImage} />
    </>
  );
}

function ImageField({ label, value, onChange, onImage }: { label: string; value: string; onChange: (value: string) => void; onImage: () => void }) {
  return (
    <div>
      <Field label={label} value={value} onChange={onChange} />
      <div className="mt-2 aspect-video overflow-hidden rounded-md bg-zinc-100" style={value ? { backgroundImage: `url(${value})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined} />
      <button type="button" onClick={onImage} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-bold text-zinc-700">
        <ImagePlus size={16} />
        Tải ảnh lên
      </button>
    </div>
  );
}

function Field({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-zinc-800">
      {label}
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal outline-none focus:border-sky-500" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-sky-500" />
      )}
    </label>
  );
}
