"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Images, Loader2, Minus, Plus, ReceiptText, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConceptAlbumCard } from "@/components/public/concept-album-card";
import { conceptQuotePricing, formatConceptQuote } from "@/lib/concept-quote";
import type { TloraConceptAlbum } from "@/types/scope";

type DetailProps = {
  album: TloraConceptAlbum;
  similarAlbums: TloraConceptAlbum[];
  categoryHighlights: TloraConceptAlbum[];
};

function albumImages(album: TloraConceptAlbum) {
  return Array.from(new Set([album.coverImageUrl, ...album.images].filter(Boolean)));
}

export function ConceptAlbumDetail({ album, similarAlbums, categoryHighlights }: DetailProps) {
  const images = useMemo(() => albumImages(album), [album]);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  function move(direction: number) {
    setActive((current) => (current + direction + images.length) % images.length);
  }

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (quoteOpen) return;
      if (event.key === "ArrowLeft") setActive((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActive((current) => (current + 1) % images.length);
      if (event.key === "Escape") setLightbox(false);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [images.length, quoteOpen]);

  useEffect(() => {
    if (!lightbox && !quoteOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [lightbox, quoteOpen]);

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f8f5ee]">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <Link href="/album-concept" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#cbc0b0] transition hover:text-[#f3d88e]"><ArrowLeft size={17} /> Bộ sưu tập</Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(310px,.55fr)] lg:items-center">
          <div className="min-w-0">
            <div className="relative isolate h-[min(70vw,620px)] min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#101115]" aria-label={`Carousel 360 độ của ${album.title}`}>
              {images.map((source, index) => {
                const total = images.length;
                let offset = index - active;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;
                const visible = Math.abs(offset) <= 2;
                return <button key={`${source}-${index}`} type="button" onClick={() => offset === 0 ? setLightbox(true) : setActive(index)} tabIndex={offset === 0 ? 0 : -1} aria-label={offset === 0 ? `Phóng to ảnh ${index + 1}` : `Chuyển đến ảnh ${index + 1}`} className="absolute inset-y-[5%] left-1/2 w-[78%] overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl transition-[transform,opacity] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-[#d8b766]" style={{ opacity: visible ? offset === 0 ? 1 : 0.42 : 0, pointerEvents: visible ? "auto" : "none", zIndex: 10 - Math.abs(offset), transform: `translateX(calc(-50% + ${offset * 22}%)) perspective(1200px) rotateY(${offset * -24}deg) scale(${offset === 0 ? 1 : 0.82})` }}><Image src={source} alt={`${album.title} — ảnh ${index + 1}`} fill priority={index === 0} quality={75} sizes="(min-width: 1024px) 62vw, 90vw" className="object-contain" /></button>;
              })}
              <button type="button" onClick={() => move(-1)} aria-label="Ảnh trước" className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/65 backdrop-blur-md hover:border-[#d8b766]"><ChevronLeft /></button>
              <button type="button" onClick={() => move(1)} aria-label="Ảnh sau" className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/65 backdrop-blur-md hover:border-[#d8b766]"><ChevronRight /></button>
              <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-bold backdrop-blur-md">{active + 1} / {images.length} · Chạm ảnh để phóng to</p>
            </div>
            <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2" aria-label="Danh sách ảnh thu nhỏ">{images.map((source, index) => <button key={`${source}-thumb`} type="button" onClick={() => setActive(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={active === index ? "true" : undefined} className={`relative h-16 w-20 shrink-0 snap-start overflow-hidden rounded-md border-2 ${active === index ? "border-[#d8b766]" : "border-transparent opacity-55 hover:opacity-100"}`}><Image src={source} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b766]">{album.categoryName || "Album Concept"}</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] sm:text-5xl">{album.title}</h1>
            <p className="mt-5 text-base leading-7 text-[#cbc0b0]">{album.excerpt || "Khám phá trọn bộ concept và câu chuyện hình ảnh được TLORA tuyển chọn."}</p>
            {album.tags.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{album.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#cbc0b0]">#{tag}</span>)}</div>}
            <button type="button" onClick={() => setQuoteOpen(true)} className="mt-8 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-6 text-sm font-bold text-[#07080a] transition hover:bg-[#f3d88e] sm:w-auto"><ReceiptText size={18} /> Báo giá dự kiến</button>
            <p className="mt-3 text-xs leading-5 text-[#8c8174]">Nhập nhu cầu để xem chi phí tham khảo ngay. TLORA sẽ xác nhận báo giá cuối cùng khi tư vấn.</p>
          </div>
        </div>
      </section>

      {similarAlbums.length > 0 && <AlbumRail title="Album tương tự" description={`Các bộ ảnh cùng danh mục ${album.categoryName || "concept"}.`} albums={similarAlbums} />}
      {categoryHighlights.length > 0 && <AlbumRail title="Khám phá danh mục khác" description="Mỗi danh mục một album tiêu biểu để bạn dễ chọn phong cách." albums={categoryHighlights} />}

      {lightbox && <Lightbox images={images} title={album.title} active={active} setActive={setActive} onClose={() => setLightbox(false)} />}
      {quoteOpen && <QuoteModal album={album} onClose={() => setQuoteOpen(false)} />}
    </main>
  );
}

function AlbumRail({ title, description, albums }: { title: string; description: string; albums: TloraConceptAlbum[] }) {
  return <section className="border-t border-white/10 py-14"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2><p className="mt-2 text-sm text-[#8c8174]">{description}</p></div><p className="hidden items-center gap-2 text-xs text-[#8c8174] sm:flex"><Images size={15} /> Vuốt để xem thêm</p></div><div className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">{albums.map((item, index) => <div key={item.id} className="w-[84vw] max-w-[390px] shrink-0 snap-start sm:w-[390px]"><ConceptAlbumCard album={item} order={index + 1} /></div>)}</div></div></section>;
}

function Lightbox({ images, title, active, setActive, onClose }: { images: string[]; title: string; active: number; setActive: React.Dispatch<React.SetStateAction<number>>; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  function move(direction: number) { setZoom(1); setActive((current) => (current + direction + images.length) % images.length); }
  return <div className="fixed inset-0 z-[70] bg-[#07080a]/98 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={`Xem ảnh ${title}`}><header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/55 p-3 backdrop-blur-md"><button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold"><X size={18} /> Thoát</button><p className="text-sm font-bold">{active + 1} / {images.length}</p><div className="flex gap-1"><IconButton label="Thu nhỏ" onClick={() => setZoom((value) => Math.max(1, value - .25))}><ZoomOut /></IconButton><IconButton label="Kích thước gốc" onClick={() => setZoom(1)}><RotateCcw /></IconButton><IconButton label="Phóng to" onClick={() => setZoom((value) => Math.min(3, value + .25))}><ZoomIn /></IconButton></div></header><div className="absolute inset-0 overflow-auto px-14 pb-8 pt-20"><div className="relative h-full min-h-[480px] w-full transition-transform duration-200" style={{ transform: `scale(${zoom})` }}><Image src={images[active]} alt={`${title} — ảnh ${active + 1}`} fill quality={75} sizes="100vw" className="object-contain" /></div></div><button type="button" onClick={() => move(-1)} aria-label="Ảnh trước" className="absolute left-2 top-1/2 z-20 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-xl"><ChevronLeft /></button><button type="button" onClick={() => move(1)} aria-label="Ảnh sau" className="absolute right-2 top-1/2 z-20 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-xl"><ChevronRight /></button></div>;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-11 place-items-center rounded-md border border-white/15 [&_svg]:size-18">{children}</button>; }

function QuoteModal({ album, onClose }: { album: TloraConceptAlbum; onClose: () => void }) {
  const [form, setForm] = useState({ customerName: "", phone: "", shootingDate: "", packageId: "signature", people: 2, outfits: 1, makeup: true, printAlbum: false, weekend: false, location: "Tại studio TLORA", note: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const selectedPackage = conceptQuotePricing.packages.find((item) => item.id === form.packageId) || conceptQuotePricing.packages[0];
  const estimate = selectedPackage.price + Math.max(0, form.people - 2) * conceptQuotePricing.extraPerson + Math.max(0, form.outfits - 1) * conceptQuotePricing.extraOutfit + (form.makeup ? conceptQuotePricing.makeup : 0) + (form.printAlbum ? conceptQuotePricing.printAlbum : 0) + (form.weekend ? conceptQuotePricing.weekend : 0);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const quoteNote = [`BÁO GIÁ DỰ KIẾN: ${formatConceptQuote(estimate)}`, `Gói: ${selectedPackage.label}`, `Số người: ${form.people}`, `Trang phục: ${form.outfits}`, `Trang điểm: ${form.makeup ? "Có" : "Không"}`, `Album in: ${form.printAlbum ? "Có" : "Không"}`, `Cuối tuần: ${form.weekend ? "Có" : "Không"}`, `Địa điểm: ${form.location}`, `Ghi chú: ${form.note || "Không"}`].join("\n");
    const response = await fetch("/api/concept-inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ albumId: album.id, customerName: form.customerName, phone: form.phone, shootingDate: form.shootingDate, note: quoteNote }) });
    const result = await response.json() as { error?: string }; setBusy(false);
    if (!response.ok) return setMessage(result.error || "Không thể gửi yêu cầu báo giá.");
    setDone(true);
  }

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quote-title"><div className="mx-auto my-3 grid w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-[#101115] text-[#f8f5ee] shadow-2xl md:my-8 md:grid-cols-[1fr_320px]"><section className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">Báo giá concept</p><h2 id="quote-title" className="mt-2 text-2xl font-extrabold">{album.title}</h2></div><button type="button" onClick={onClose} aria-label="Đóng báo giá" className="grid size-11 place-items-center rounded-md border border-white/10 md:hidden"><X /></button></div>{done ? <div className="py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-400 text-black"><Check /></span><h3 className="mt-5 text-xl font-bold">Đã gửi yêu cầu báo giá</h3><p className="mt-2 text-sm text-[#8c8174]">TLORA sẽ kiểm tra nhu cầu và liên hệ xác nhận với bạn.</p><button type="button" onClick={onClose} className="mt-6 rounded-md border border-white/15 px-5 py-3 text-sm font-bold">Xem tiếp album</button></div> : <form id="concept-quote-form" onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><QuoteInput label="Họ tên" value={form.customerName} onChange={(value) => set("customerName", value)} required /><QuoteInput label="SĐT / Zalo" value={form.phone} onChange={(value) => set("phone", value)} required type="tel" /><QuoteInput label="Ngày chụp dự kiến" value={form.shootingDate} onChange={(value) => set("shootingDate", value)} type="date" /><QuoteInput label="Địa điểm" value={form.location} onChange={(value) => set("location", value)} /><label className="block text-sm font-bold sm:col-span-2">Gói chụp<select value={form.packageId} onChange={(event) => set("packageId", event.target.value)} className="quote-field">{conceptQuotePricing.packages.map((item) => <option key={item.id} value={item.id}>{item.label} — {item.description}</option>)}</select></label><Counter label="Số người chụp" value={form.people} min={1} max={12} onChange={(value) => set("people", value)} /><Counter label="Số trang phục" value={form.outfits} min={1} max={8} onChange={(value) => set("outfits", value)} /><Toggle label="Trang điểm tại studio" checked={form.makeup} onChange={(value) => set("makeup", value)} /><Toggle label="In album ảnh" checked={form.printAlbum} onChange={(value) => set("printAlbum", value)} /><Toggle label="Chụp cuối tuần" checked={form.weekend} onChange={(value) => set("weekend", value)} /><label className="block text-sm font-bold sm:col-span-2">Mô tả thêm<textarea value={form.note} onChange={(event) => set("note", event.target.value)} maxLength={300} placeholder="Phong cách, màu sắc, đạo cụ hoặc yêu cầu riêng..." className="quote-field min-h-24 py-3" /></label>{message && <p className="text-sm text-red-300 sm:col-span-2">{message}</p>}</form>}</section><aside className="border-t border-white/10 bg-[#14110f] p-5 md:border-l md:border-t-0 md:p-6"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">Tạm tính</p><button type="button" onClick={onClose} aria-label="Đóng báo giá" className="hidden size-11 place-items-center rounded-md border border-white/10 md:grid"><X /></button></div><p className="mt-5 text-3xl font-black text-[#f3d88e]">{formatConceptQuote(estimate)}</p><p className="mt-2 text-xs leading-5 text-[#8c8174]">Chi phí tham khảo, chưa phải báo giá cuối cùng.</p><div className="my-5 h-px bg-white/10"/><QuoteLine label={selectedPackage.label} value={selectedPackage.price} />{form.people > 2 && <QuoteLine label={`${form.people - 2} người thêm`} value={(form.people - 2) * conceptQuotePricing.extraPerson} />}{form.outfits > 1 && <QuoteLine label={`${form.outfits - 1} trang phục thêm`} value={(form.outfits - 1) * conceptQuotePricing.extraOutfit} />}{form.makeup && <QuoteLine label="Trang điểm" value={conceptQuotePricing.makeup} />}{form.printAlbum && <QuoteLine label="Album in" value={conceptQuotePricing.printAlbum} />}{form.weekend && <QuoteLine label="Phụ thu cuối tuần" value={conceptQuotePricing.weekend} />}{!done && <button form="concept-quote-form" type="submit" disabled={busy} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-[#07080a] disabled:opacity-50">{busy ? <Loader2 className="animate-spin" /> : <ReceiptText />} Gửi yêu cầu báo giá</button>}</aside></div></div>;
}

function QuoteInput({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label className="block text-sm font-bold">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="quote-field" /></label>; }
function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <div><p className="text-sm font-bold">{label}</p><div className="mt-2 flex min-h-12 items-center justify-between rounded-md border border-white/10 bg-[#07080a]"><button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Giảm ${label}`} className="grid size-11 place-items-center"><Minus size={16} /></button><strong>{value}</strong><button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Tăng ${label}`} className="grid size-11 place-items-center"><Plus size={16} /></button></div></div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-white/10 bg-[#07080a] px-3 text-sm font-bold"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#d8b766]" /></label>; }
function QuoteLine({ label, value }: { label: string; value: number }) { return <p className="mt-3 flex justify-between gap-4 text-xs text-[#cbc0b0]"><span>{label}</span><span>{formatConceptQuote(value)}</span></p>; }
