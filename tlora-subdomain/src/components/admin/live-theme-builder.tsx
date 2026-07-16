"use client";

import {
  Columns3,
  Image as ImageIcon,
  ImagePlus,
  Laptop,
  MousePointer2,
  Rows3,
  Save,
  Smartphone,
  SquareMousePointer,
  Tablet,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type BlockType = "section" | "columns" | "text" | "button" | "image" | "spacer";
type Device = "desktop" | "tablet" | "mobile";

type UxBlock = {
  id: string;
  type: BlockType;
  title?: string;
  text?: string;
  href?: string;
  image?: string;
  columns?: string[];
  style: {
    background?: string;
    color?: string;
    align?: "left" | "center" | "right";
    padding?: number;
    gap?: number;
    radius?: number;
    fontSize?: number;
    height?: number;
  };
};

type UxPages = Record<string, UxBlock[]>;

const elements: Array<{ type: BlockType; label: string; icon: typeof Type }> = [
  { type: "section", label: "Section", icon: Rows3 },
  { type: "columns", label: "Row / Columns", icon: Columns3 },
  { type: "text", label: "Text", icon: Type },
  { type: "button", label: "Button", icon: SquareMousePointer },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "spacer", label: "Spacer", icon: MousePointer2 },
];

const deviceWidths: Record<Device, string> = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
};

function id() {
  return `ux_${Math.random().toString(36).slice(2, 10)}`;
}

function newBlock(type: BlockType): UxBlock {
  const base = { id: id(), type, style: { padding: 32, gap: 20, radius: 0, align: "left" as const } };
  if (type === "section") return { ...base, title: "Tiêu đề section", text: "Nội dung giới thiệu ngắn cho khu vực này.", style: { ...base.style, background: "#111111", color: "#ffffff", padding: 72, align: "center" } };
  if (type === "columns") return { ...base, title: "Row 3 cột", columns: ["Cột nội dung 1", "Cột nội dung 2", "Cột nội dung 3"], style: { ...base.style, background: "#ffffff", color: "#111111", padding: 40, radius: 8 } };
  if (type === "text") return { ...base, title: "Tiêu đề", text: "Đoạn văn bản của bạn.", style: { ...base.style, color: "#111111", fontSize: 18, padding: 24 } };
  if (type === "button") return { ...base, text: "Nút hành động", href: "#", style: { ...base.style, background: "#111111", color: "#ffffff", padding: 14, radius: 6, align: "center" } };
  if (type === "image") return { ...base, image: "/brand/tlora-logo.png", style: { ...base.style, background: "#f4f4f5", padding: 24, radius: 8, align: "center" } };
  return { ...base, style: { ...base.style, height: 48, padding: 0 } };
}

function defaultBlocks(pageName: string): UxBlock[] {
  return [
    { ...newBlock("section"), title: pageName, text: "Kéo thả element từ thư viện bên trái để xây dựng trang này." },
    newBlock("columns"),
  ];
}

export function LiveThemeBuilder({
  saved,
  pageName,
  pageKey,
}: {
  src: string;
  saved?: { ux_pages?: UxPages };
  pageName: string;
  pageKey: string;
}) {
  const initialBlocks = saved?.ux_pages?.[pageKey]?.length ? saved.ux_pages[pageKey] : defaultBlocks(pageName);
  const [blocks, setBlocks] = useState<UxBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState(initialBlocks[0]?.id || "");
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const uploadInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef("");
  const selected = useMemo(() => blocks.find((block) => block.id === selectedId) || blocks[0], [blocks, selectedId]);

  function add(type: BlockType, at = blocks.length) {
    const block = newBlock(type);
    setBlocks((current) => [...current.slice(0, at), block, ...current.slice(at)]);
    setSelectedId(block.id);
  }

  function update(idValue: string, patch: Partial<UxBlock>) {
    setBlocks((current) => current.map((block) => (block.id === idValue ? { ...block, ...patch, style: { ...block.style, ...patch.style } } : block)));
  }

  function remove(idValue: string) {
    setBlocks((current) => {
      const next = current.filter((block) => block.id !== idValue);
      setSelectedId(next[0]?.id || "");
      return next;
    });
  }

  function chooseImage(idValue: string) {
    uploadTarget.current = idValue;
    setSelectedId(idValue);
    uploadInput.current?.click();
  }

  function uploadImage(file: File) {
    const target = uploadTarget.current;
    const reader = new FileReader();
    reader.onload = () => update(target, { image: String(reader.result) });
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/studio-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ux_pages: { [pageKey]: blocks } } }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể lưu layout.");
      setNotice("Đã lưu layout và đồng bộ website.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu layout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <input
        ref={uploadInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.currentTarget.value = "";
        }}
      />
      <div className="grid min-h-[calc(100vh-180px)] lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="border-b border-zinc-200 bg-zinc-950 p-4 text-white lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b766]">Elements</p>
          <div className="mt-4 grid gap-2">
            {elements.map((element) => {
              const Icon = element.icon;
              return (
                <button
                  key={element.type}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("tlora/type", element.type)}
                  onClick={() => add(element.type)}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-white/[.04] px-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/[.1]"
                >
                  <Icon size={17} />
                  {element.label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 bg-zinc-100 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-950">UX Builder - {pageName}</h2>
              <p className="text-sm text-zinc-600">Kéo element vào canvas, chọn block để chỉnh nội dung và giao diện.</p>
            </div>
            <div className="flex rounded-md border border-zinc-300 bg-white p-1">
              {(["desktop", "tablet", "mobile"] as Device[]).map((item) => {
                const Icon = item === "desktop" ? Laptop : item === "tablet" ? Tablet : Smartphone;
                return <button key={item} onClick={() => setDevice(item)} className={`grid size-9 place-items-center rounded ${device === item ? "bg-zinc-950 text-white" : "text-zinc-600"}`}><Icon size={17} /></button>;
              })}
            </div>
          </div>

          <div className="mx-auto min-h-[70vh] overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-xl transition-all" style={{ width: deviceWidths[device] }}>
            <div
              className="min-h-[70vh]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const type = event.dataTransfer.getData("tlora/type") as BlockType;
                if (type) add(type);
              }}
            >
              {blocks.map((block, index) => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  selected={selectedId === block.id}
                  onSelect={() => setSelectedId(block.id)}
                  onChange={(patch) => update(block.id, patch)}
                  onImagePick={() => chooseImage(block.id)}
                  onDropBefore={(type) => add(type, index)}
                />
              ))}
              {blocks.length === 0 && <div className="grid min-h-96 place-items-center border-2 border-dashed border-zinc-300 text-sm text-zinc-500">Kéo element vào đây</div>}
            </div>
          </div>
        </main>

        <aside className="border-t border-zinc-200 bg-white p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-sky-700">Inspector</p>
              <h3 className="mt-1 text-lg font-extrabold text-zinc-950">{selected ? selected.type : "Chưa chọn"}</h3>
            </div>
            {selected && <button onClick={() => remove(selected.id)} className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700"><Trash2 size={16} /></button>}
          </div>

          {selected && <Inspector block={selected} onChange={(patch) => update(selected.id, patch)} onImagePick={() => chooseImage(selected.id)} />}

          <button onClick={save} disabled={saving} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-60">
            <Save size={17} />
            {saving ? "Đang lưu..." : "Lưu layout"}
          </button>
          {notice && <p className="mt-3 text-center text-xs font-semibold text-emerald-700">{notice}</p>}
        </aside>
      </div>
    </section>
  );
}

function CanvasBlock({
  block,
  selected,
  onSelect,
  onChange,
  onImagePick,
  onDropBefore,
}: {
  block: UxBlock;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<UxBlock>) => void;
  onImagePick: () => void;
  onDropBefore: (type: BlockType) => void;
}) {
  return (
    <div
      onClick={(event) => { event.stopPropagation(); onSelect(); }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("tlora/type") as BlockType;
        if (type) onDropBefore(type);
      }}
      className={`relative cursor-pointer border-2 border-transparent ${selected ? "border-sky-500" : "hover:border-sky-300"}`}
    >
      <RenderBlock block={block} onChange={onChange} onImagePick={onImagePick} />
    </div>
  );
}

function RenderBlock({ block, onChange, onImagePick }: { block: UxBlock; onChange: (patch: Partial<UxBlock>) => void; onImagePick: () => void }) {
  const style = block.style;
  if (block.type === "spacer") return <div style={{ height: style.height || 48 }} />;
  if (block.type === "button") {
    return (
      <div className="px-6 py-4" style={{ textAlign: style.align }}>
        <EditableCanvasText
          as="span"
          value={block.text || ""}
          onChange={(text) => onChange({ text })}
          className="inline-flex min-h-11 items-center rounded-md px-5 text-sm font-bold"
          style={{ background: style.background, color: style.color, borderRadius: style.radius }}
        />
      </div>
    );
  }
  if (block.type === "image") {
    return (
      <section className="group relative px-6 py-6" style={{ textAlign: style.align, background: style.background }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Builder accepts data URLs and arbitrary tenant image origins. */}
        <img src={block.image || "/brand/tlora-logo.png"} alt="" className="inline-block max-h-96 max-w-full object-contain" style={{ borderRadius: style.radius }} />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onImagePick();
          }}
          className="absolute bottom-4 left-1/2 inline-flex min-h-9 -translate-x-1/2 items-center gap-2 rounded-md bg-black/75 px-3 text-xs font-bold text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <ImagePlus size={15} />
          Đổi ảnh
        </button>
      </section>
    );
  }
  if (block.type === "columns") {
    return (
      <section className="grid gap-4 p-8 md:grid-cols-3" style={{ background: style.background, color: style.color, padding: style.padding, gap: style.gap }}>
        {(block.columns || []).map((column, index) => (
          <EditableCanvasText
            key={index}
            as="div"
            value={column}
            onChange={(value) => {
              const columns = [...(block.columns || [])];
              columns[index] = value;
              onChange({ columns });
            }}
            className="rounded-md border border-current/10 p-5"
          />
        ))}
      </section>
    );
  }
  return (
    <section className="px-6" style={{ background: style.background, color: style.color, padding: style.padding, textAlign: style.align }}>
      <EditableCanvasText
        as="h2"
        value={block.title || ""}
        onChange={(title) => onChange({ title })}
        style={{ fontSize: style.fontSize || 42 }}
        className="font-extrabold leading-tight"
      />
      {block.text !== undefined && (
        <EditableCanvasText
          as="p"
          value={block.text || ""}
          onChange={(text) => onChange({ text })}
          className="mx-auto mt-4 max-w-2xl leading-7 opacity-75"
        />
      )}
    </section>
  );
}

function Inspector({ block, onChange, onImagePick }: { block: UxBlock; onChange: (patch: Partial<UxBlock>) => void; onImagePick: () => void }) {
  return (
    <div className="mt-5 space-y-4">
      {block.type !== "spacer" && block.type !== "button" && <Field label="Tiêu đề" value={block.title || ""} onChange={(title) => onChange({ title })} />}
      {["section", "text"].includes(block.type) && <Field label="Nội dung" value={block.text || ""} onChange={(text) => onChange({ text })} multiline />}
      {block.type === "button" && <><Field label="Nhãn nút" value={block.text || ""} onChange={(text) => onChange({ text })} /><Field label="Link" value={block.href || ""} onChange={(href) => onChange({ href })} /></>}
      {block.type === "image" && (
        <div>
          <Field label="Link ảnh" value={block.image || ""} onChange={(image) => onChange({ image })} />
          <button type="button" onClick={onImagePick} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-bold">
            <ImagePlus size={16} />
            Tải ảnh thay thế
          </button>
        </div>
      )}
      {block.type === "columns" && <Field label="Nội dung cột, mỗi dòng một cột" value={(block.columns || []).join("\n")} onChange={(value) => onChange({ columns: value.split("\n") })} multiline />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Màu nền" value={block.style.background || ""} onChange={(background) => onChange({ style: { background } })} />
        <Field label="Màu chữ" value={block.style.color || ""} onChange={(color) => onChange({ style: { color } })} />
        <NumberField label="Padding" value={block.style.padding || 0} onChange={(padding) => onChange({ style: { padding } })} />
        <NumberField label="Bo góc" value={block.style.radius || 0} onChange={(radius) => onChange({ style: { radius } })} />
        <NumberField label="Font size" value={block.style.fontSize || 0} onChange={(fontSize) => onChange({ style: { fontSize } })} />
        <NumberField label="Chiều cao" value={block.style.height || 0} onChange={(height) => onChange({ style: { height } })} />
      </div>
      <label className="block text-sm font-bold text-zinc-800">Canh lề<select value={block.style.align || "left"} onChange={(event) => onChange({ style: { align: event.target.value as UxBlock["style"]["align"] } })} className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3 font-normal"><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label>
    </div>
  );
}

function EditableCanvasText({
  as: Tag,
  value,
  onChange,
  className,
  style,
}: {
  as: "h2" | "p" | "span" | "div";
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: CSSProperties;
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
      className={`${className || ""} cursor-text rounded-sm outline-none transition focus:ring-2 focus:ring-sky-400 focus:ring-offset-2`}
      style={style}
    />
  );
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className="block text-sm font-bold text-zinc-800">{label}{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal outline-none focus:border-sky-500" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-sky-500" />}</label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block text-sm font-bold text-zinc-800">{label}<input type="number" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-sky-500" /></label>;
}
