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

const emptyItem = (title = "Má»¥c má»›i"): Item => ({
  title,
  subtitle: "Danh má»¥c",
  description: "Nháº­p mÃ´ táº£ ngáº¯n cho má»¥c nÃ y.",
  image: "",
  price: "LiÃªn há»‡",
  features: "",
});

const initialContent: Content = {
  hero: {
    title: "CÃ¢u chuyá»‡n cá»§a studio báº¯t Ä‘áº§u tá»« Ä‘Ã¢y",
    description: "Thay cÃ¢u chá»¯ vÃ  hÃ¬nh áº£nh Ä‘á»ƒ website thá»ƒ hiá»‡n Ä‘Ãºng phong cÃ¡ch studio cá»§a báº¡n.",
    image: "",
    cta: "Äáº·t lá»‹ch tÆ° váº¥n",
  },
  about: { title: "Vá» studio", description: "Giá»›i thiá»‡u ngáº¯n vá» phong cÃ¡ch, Ä‘á»™i ngÅ© vÃ  tráº£i nghiá»‡m khÃ¡ch hÃ ng.", image: "" },
  services: [emptyItem("Dá»‹ch vá»¥ 1"), emptyItem("Dá»‹ch vá»¥ 2"), emptyItem("Dá»‹ch vá»¥ 3")],
  pricing: [emptyItem("GÃ³i cÆ¡ báº£n"), emptyItem("GÃ³i phá»• biáº¿n"), emptyItem("GÃ³i cao cáº¥p")],
  gallery: [emptyItem("Album 1"), emptyItem("Album 2"), emptyItem("Album 3")],
};

function normalizeContent(saved?: Partial<Content>): Content {
  return {
    ...initialContent,
    ...saved,
    hero: { ...initialContent.hero, ...saved?.hero },
    about: { ...initialContent.about, ...saved?.about },
    services: saved?.services?.length ? saved.services : initialContent.services,
    pricing: saved?.pricing?.length ? saved.pricing : initialContent.pricing,
    gallery: saved?.gallery?.length ? saved.gallery : initialContent.gallery,
  };
}

function normalizeContact(settings?: Record<string, unknown>): Contact {
  return {
    logo_url: String(settings?.logo_url || ""),
    phone: String(settings?.phone || ""),
    email: String(settings?.email || ""),
    address: String(settings?.address || ""),
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
  const activePageLabel = pageLabel || "Trang chá»§";
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

  function addItem(type: "services" | "pricing" | "gallery") {
    setContent((current) => ({ ...current, [type]: [...current[type], emptyItem(type === "pricing" ? "GÃ³i má»›i" : type === "gallery" ? "Album má»›i" : "Dá»‹ch vá»¥ má»›i")] }));
    setSelected({ type, index: content[type].length });
  }

  function removeItem(type: "services" | "pricing" | "gallery", index: number) {
    setContent((current) => ({ ...current, [type]: current[type].filter((_, itemIndex) => itemIndex !== index) }));
    setSelected({ type, index: Math.max(0, index - 1) });
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
      if (!response.ok) throw new Error(data.error || "KhÃ´ng thá»ƒ lÆ°u website.");
      setMessage("ÄÃ£ lÆ°u vÃ  Ä‘á»“ng bá»™ website.");
      setFrameNonce((value) => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ lÆ°u website.");
    } finally {
      setSaving(false);
    }
  }

  const title = useMemo(() => {
    if (selected.type === "brand") return "Logo & nháº­n diá»‡n";
    if (selected.type === "hero") return "Hero trang chá»§";
    if (selected.type === "about") return "Giá»›i thiá»‡u";
    if (selected.type === "services") return `Dá»‹ch vá»¥ ${(selected.index || 0) + 1}`;
    if (selected.type === "pricing") return `Báº£ng giÃ¡ ${(selected.index || 0) + 1}`;
    if (selected.type === "gallery") return `Album ${(selected.index || 0) + 1}`;
    return "LiÃªn há»‡";
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
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#c99a5e]">Äang sá»­a</p>
              <h2 className="mt-1 text-xl font-extrabold text-zinc-950">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Báº¥m trá»±c tiáº¿p vÃ o website bÃªn pháº£i Ä‘á»ƒ chá»n khu vá»±c cáº§n sá»­a.</p>
            </div>
            <button type="button" onClick={() => setFrameNonce((value) => value + 1)} className="grid size-9 shrink-0 place-items-center rounded-md border border-zinc-300 text-zinc-700" title="Táº£i láº¡i preview">
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
                onAdd={() => addItem(selected.type as "services" | "pricing" | "gallery")}
                onRemove={() => removeItem(selected.type as "services" | "pricing" | "gallery", selected.index || 0)}
              />
            )}
            {selected.type === "contact" && <ContactFields contact={contact} update={updateContact} />}
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4">
            <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {saving ? "Äang lÆ°u..." : "LÆ°u website"}
            </button>
            {message && <p className={`mt-3 text-center text-xs font-bold ${message.startsWith("ÄÃ£") ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
          </div>
        </aside>

        <main className="min-w-0 bg-zinc-100 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <MonitorSmartphone size={17} />
              Live preview tháº­t: {activePageLabel}
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
    { label: "Giá»›i thiá»‡u", value: { type: "about" } },
    { label: "LiÃªn há»‡", value: { type: "contact" } },
  ];
  return (
    <div className="mt-5 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {groups.map((group) => <NavButton key={group.label} label={group.label} active={selectionKey(selected) === selectionKey(group.value)} onClick={() => onSelect(group.value)} />)}
      </div>
      <MiniList label="Dá»‹ch vá»¥" type="services" items={content.services} selected={selected} onSelect={onSelect} />
      <MiniList label="Báº£ng giÃ¡" type="pricing" items={content.pricing} selected={selected} onSelect={onSelect} />
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
      <Field label="Sá»‘ Ä‘iá»‡n thoáº¡i" value={contact.phone} onChange={(value) => update("phone", value)} />
      <Field label="Email" value={contact.email} onChange={(value) => update("email", value)} />
      <Field label="Äá»‹a chá»‰" value={contact.address} onChange={(value) => update("address", value)} textarea />
      <Field label="Facebook" value={contact.facebook_url} onChange={(value) => update("facebook_url", value)} />
      <Field label="Zalo" value={contact.zalo_phone} onChange={(value) => update("zalo_phone", value.replace(/[^0-9+]/g, ""))} />
    </>
  );
}

function PanelFields({ values, onChange, onImage, showCta = false }: { values: { title: string; description: string; image: string; cta?: string }; onChange: (key: PanelKey, value: string) => void; onImage: () => void; showCta?: boolean }) {
  return (
    <>
      <Field label="TiÃªu Ä‘á»" value={values.title} onChange={(value) => onChange("title", value)} />
      <Field label="MÃ´ táº£" value={values.description} onChange={(value) => onChange("description", value)} textarea />
      {showCta && <Field label="NÃºt kÃªu gá»i" value={values.cta || ""} onChange={(value) => onChange("cta", value)} />}
      <ImageField label="HÃ¬nh áº£nh" value={values.image} onChange={(value) => onChange("image", value)} onImage={onImage} />
    </>
  );
}

function ItemFields({ item, type, onChange, onImage, onAdd, onRemove }: { item: Item; type: "services" | "pricing" | "gallery"; onChange: (key: keyof Item, value: string) => void; onImage: () => void; onAdd: () => void; onRemove: () => void }) {
  return (
    <>
      <Field label="TiÃªu Ä‘á»" value={item.title} onChange={(value) => onChange("title", value)} />
      <Field label="NhÃ£n phá»¥" value={item.subtitle} onChange={(value) => onChange("subtitle", value)} />
      <Field label="MÃ´ táº£" value={item.description} onChange={(value) => onChange("description", value)} textarea />
      {type === "pricing" && <Field label="GiÃ¡" value={item.price} onChange={(value) => onChange("price", value)} />}
      {type !== "gallery" && <Field label="Äiá»ƒm ná»•i báº­t" value={item.features} onChange={(value) => onChange("features", value)} textarea />}
      <ImageField label="HÃ¬nh áº£nh" value={item.image} onChange={(value) => onChange("image", value)} onImage={onImage} />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button type="button" onClick={onAdd} className="min-h-10 rounded-md border border-zinc-300 text-sm font-bold text-zinc-700">ThÃªm má»¥c</button>
        <button type="button" onClick={onRemove} className="min-h-10 rounded-md border border-red-200 text-sm font-bold text-red-700">XÃ³a má»¥c</button>
      </div>
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
        Táº£i áº£nh lÃªn
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
