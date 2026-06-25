"use client";

import { ImagePlus, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Item = { title: string; subtitle: string; description: string; image: string; price: string; features: string };
type SectionType = "hero" | "about" | "services" | "pricing" | "gallery";
type Content = {
  hero: { title: string; description: string; image: string; cta: string };
  about: { title: string; description: string; image: string };
  services: Item[];
  pricing: Item[];
  gallery: Item[];
};
type Selection = { type: SectionType; index?: number };

const emptyItem = (): Item => ({
  title: "Dịch vụ mới",
  subtitle: "Danh mục",
  description: "Mô tả dịch vụ của studio.",
  image: "",
  price: "Liên hệ",
  features: "",
});

const initial: Content = {
  hero: {
    title: "Câu chuyện của studio bắt đầu từ đây",
    description: "Thay đổi câu chữ và hình ảnh bằng thanh công cụ bên phải.",
    image: "",
    cta: "Đặt lịch tư vấn",
  },
  about: { title: "Về studio", description: "Giới thiệu ngắn về phong cách và đội ngũ của bạn.", image: "" },
  services: [emptyItem(), emptyItem(), emptyItem()],
  pricing: [emptyItem(), emptyItem(), emptyItem()],
  gallery: [emptyItem(), emptyItem(), emptyItem()],
};

export function ThemeContentEditor({ saved }: { saved?: Partial<Content> }) {
  const [content, setContent] = useState<Content>({
    ...initial,
    ...saved,
    hero: { ...initial.hero, ...saved?.hero },
    about: { ...initial.about, ...saved?.about },
    services: saved?.services?.length ? saved.services : initial.services,
    pricing: saved?.pricing?.length ? saved.pricing : initial.pricing,
    gallery: saved?.gallery?.length ? saved.gallery : initial.gallery,
  });
  const [selected, setSelected] = useState<Selection>({ type: "hero" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<Selection>({ type: "hero" });

  const active = selected.type === "hero" || selected.type === "about" ? content[selected.type] : content[selected.type][selected.index || 0];

  function updateAt(target: Selection, key: string, value: string) {
    setContent((current) => {
      if (target.type === "hero" || target.type === "about") {
        return { ...current, [target.type]: { ...current[target.type], [key]: value } };
      }
      const index = target.index || 0;
      return {
        ...current,
        [target.type]: current[target.type].map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
      };
    });
  }

  const update = (key: string, value: string) => updateAt(selected, key, value);

  function chooseImage(target: Selection) {
    uploadTarget.current = target;
    setSelected(target);
    upload.current?.click();
  }

  function uploadImage(file: File) {
    const target = uploadTarget.current;
    const reader = new FileReader();
    reader.onload = () => updateAt(target, "image", String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/studio-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { site_content: content } }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể lưu nội dung.");
      setMessage("Đã đồng bộ website.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu nội dung.");
    } finally {
      setSaving(false);
    }
  }

  const chosen = (item: Selection) => selected.type === item.type && selected.index === item.index;
  const select = (item: Selection) => setSelected(item);
  const pick = (item: Selection, children: ReactNode, className = "") => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => select(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") select(item);
      }}
      className={`group relative text-left outline-none transition ${chosen(item) ? "ring-2 ring-sky-500 ring-offset-2" : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-2"} ${className}`}
    >
      {children}
      {chosen(item) && <span className="pointer-events-none absolute right-2 top-2 rounded bg-sky-600 px-2 py-1 text-[10px] font-bold text-white">Đang chọn</span>}
    </div>
  );
  return (
    <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm">
      <input
        ref={upload}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.currentTarget.value = "";
        }}
      />
      <div className="border-b border-zinc-200 bg-white p-5">
        <h2 className="text-xl font-extrabold text-zinc-950">Trình chỉnh sửa nội dung website</h2>
        <p className="mt-1 text-sm text-zinc-600">Bấm trực tiếp vào chữ để sửa, hoặc bấm nút đổi ảnh ngay trên bản xem trước.</p>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 p-5">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-[#151515] shadow-2xl">
            <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-zinc-950 px-4 text-[11px] text-zinc-400">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ml-3 rounded bg-white/5 px-3 py-1">Bản xem trước website</span>
            </div>
            <div className="text-white">
              <section
                className="relative min-h-105 overflow-hidden bg-zinc-900 p-8 sm:p-14"
                style={
                  content.hero.image
                    ? {
                        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.28)), url(${content.hero.image})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              >
                {pick(
                  { type: "hero" },
                  <div className="max-w-xl">
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d4af37]">Trang chủ</p>
                    <EditableText
                      as="h3"
                      value={content.hero.title}
                      onChange={(value) => updateAt({ type: "hero" }, "title", value)}
                      className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl"
                    />
                    <EditableText
                      as="p"
                      value={content.hero.description}
                      onChange={(value) => updateAt({ type: "hero" }, "description", value)}
                      className="mt-5 max-w-lg leading-7 text-zinc-300"
                    />
                    <EditableText
                      as="span"
                      value={content.hero.cta}
                      onChange={(value) => updateAt({ type: "hero" }, "cta", value)}
                      className="mt-7 inline-block bg-[#d4af37] px-5 py-3 text-sm font-bold text-zinc-950"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseImage({ type: "hero" });
                      }}
                      className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-white/90 px-3 text-xs font-bold text-zinc-950 shadow"
                    >
                      <ImagePlus size={15} />
                      Đổi ảnh hero
                    </button>
                  </div>,
                  "block w-full"
                )}
              </section>
              <section className="grid gap-6 bg-white p-7 text-zinc-900 md:grid-cols-2">
                {pick(
                  { type: "about" },
                  <>
                    <ImageSlot image={content.about.image} label="Đổi ảnh giới thiệu" onClick={() => chooseImage({ type: "about" })} />
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#b88951]">Giới thiệu</p>
                      <EditableText as="h3" value={content.about.title} onChange={(value) => updateAt({ type: "about" }, "title", value)} className="mt-3 text-3xl font-bold" />
                      <EditableText as="p" value={content.about.description} onChange={(value) => updateAt({ type: "about" }, "description", value)} className="mt-3 leading-7 text-zinc-600" />
                    </div>
                  </>,
                  "block rounded"
                )}
              </section>
              <PreviewCollection label="Dịch vụ" items={content.services} type="services" pick={pick} updateAt={updateAt} chooseImage={chooseImage} />
              <PreviewCollection label="Bảng giá" items={content.pricing} type="pricing" pick={pick} updateAt={updateAt} chooseImage={chooseImage} pricing />
              <PreviewCollection label="Portfolio" items={content.gallery} type="gallery" pick={pick} updateAt={updateAt} chooseImage={chooseImage} />
            </div>
          </div>
        </main>
        <aside className="border-t border-zinc-200 bg-white p-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-sky-700">Thanh công cụ</p>
          <h3 className="mt-2 text-lg font-extrabold text-zinc-950">
            {selected.type === "hero" ? "Hero trang chủ" : selected.type === "about" ? "Giới thiệu" : selected.type === "services" ? "Dịch vụ" : selected.type === "pricing" ? "Gói giá" : "Album Portfolio"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Bạn vẫn có thể chỉnh bằng thanh công cụ nếu muốn nhập nội dung dài.</p>
          <div className="mt-5 space-y-4">
            <EditorField label="Tiêu đề" value={(active as Item).title || ""} onChange={(value) => update("title", value)} />
            <EditorField label="Nhãn phụ / danh mục" value={(active as Item).subtitle || ""} onChange={(value) => update("subtitle", value)} />
            <EditorField label="Mô tả" value={(active as Item).description || ""} onChange={(value) => update("description", value)} textarea />
            <EditorField label="Nhãn nút" value={(active as Content["hero"]).cta || ""} onChange={(value) => update("cta", value)} />
            <EditorField label="Giá" value={(active as Item).price || ""} onChange={(value) => update("price", value)} />
            <EditorField label="Điểm nổi bật" value={(active as Item).features || ""} onChange={(value) => update("features", value)} />
            <div>
              <p className="text-sm font-semibold text-zinc-800">Hình ảnh</p>
              <div
                className="mt-2 aspect-video overflow-hidden rounded-md bg-zinc-100"
                style={(active as Item).image ? { backgroundImage: `url(${(active as Item).image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              />
              <button type="button" onClick={() => chooseImage(selected)} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-bold">
                <ImagePlus size={16} />
                Tải ảnh thay thế
              </button>
              <p className="mt-1 text-xs text-zinc-500">Khuyến nghị: Hero 1920x1080; thẻ/album 1200x900.</p>
            </div>
          </div>
          <div className="mt-7 border-t border-zinc-200 pt-5">
            <button type="button" disabled={saving} onClick={save} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-60">
              <Save size={16} />
              {saving ? "Đang lưu..." : "Lưu & đồng bộ website"}
            </button>
            {message && <p className="mt-2 text-center text-xs font-bold text-emerald-700">{message}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EditableText({
  as: Tag,
  value,
  onChange,
  className,
}: {
  as: "h3" | "p" | "span";
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (document.activeElement === ref.current) return;
    if (ref.current && ref.current.textContent !== value) ref.current.textContent = value;
  }, [value]);

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onClick={(event) => event.stopPropagation()}
      onInput={(event) => onChange(event.currentTarget.textContent || "")}
      className={`${className} cursor-text rounded-sm outline-none transition focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent`}
    />
  );
}

function ImageSlot({ image, label, onClick }: { image: string; label: string; onClick: () => void }) {
  return (
    <div
      className="group relative aspect-4/3 bg-zinc-200"
      style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <button type="button" className="absolute inset-x-3 bottom-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-black/75 px-3 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <ImagePlus size={15} />
        {label}
      </button>
    </div>
  );
}

function EditorField({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  if (!value && ["Nhãn phụ / danh mục", "Nhãn nút", "Giá", "Điểm nổi bật"].includes(label)) return null;
  return (
    <label className="block text-sm font-semibold text-zinc-800">
      {label}
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-20 w-full rounded-md border border-zinc-300 p-3 font-normal" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3 font-normal" />
      )}
    </label>
  );
}

function PreviewCollection({
  label,
  items,
  type,
  pick,
  updateAt,
  chooseImage,
  pricing = false,
}: {
  label: string;
  items: Item[];
  type: "services" | "pricing" | "gallery";
  pick: (item: Selection, children: ReactNode, className?: string) => ReactNode;
  updateAt: (target: Selection, key: string, value: string) => void;
  chooseImage: (target: Selection) => void;
  pricing?: boolean;
}) {
  return (
    <section className="border-t border-zinc-800 bg-[#191919] p-7">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d4af37]">{label}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item, index) =>
          pick(
            { type, index },
            <div className="overflow-hidden border border-white/10 bg-white/[.04]">
              <ImageSlot image={item.image} label="Đổi ảnh" onClick={() => chooseImage({ type, index })} />
              <div className="p-4">
                <EditableText as="p" value={item.subtitle || label} onChange={(value) => updateAt({ type, index }, "subtitle", value)} className="text-xs text-[#d4af37]" />
                <EditableText as="h3" value={item.title} onChange={(value) => updateAt({ type, index }, "title", value)} className="mt-2 text-lg font-bold" />
                <EditableText as="p" value={item.description} onChange={(value) => updateAt({ type, index }, "description", value)} className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400" />
                {pricing && <EditableText as="p" value={item.price} onChange={(value) => updateAt({ type, index }, "price", value)} className="mt-4 text-lg font-bold text-[#d4af37]" />}
              </div>
            </div>,
            "block"
          )
        )}
      </div>
    </section>
  );
}
