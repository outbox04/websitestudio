"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ConceptAlbumCard } from "@/components/public/concept-album-card";
import type { TloraConceptAlbum, TloraConceptCategory } from "@/types/scope";

const pageSize = 15;

export function ConceptAlbumsView({
  albums,
  categories,
  initialSlug,
  initialConsult,
}: {
  albums: TloraConceptAlbum[];
  categories: TloraConceptCategory[];
  initialSlug?: string;
  initialConsult?: string;
}) {
  const [selected, setSelected] = useState<TloraConceptAlbum | null>(() => albums.find((album) => album.slug === initialSlug) || null);
  const [consulting, setConsulting] = useState<TloraConceptAlbum | null>(() => albums.find((album) => album.slug === initialConsult) || null);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => category === "all" ? albums : albums.filter((album) => album.categorySlug === category), [albums, category]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (!selected && !consulting) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [consulting, selected]);

  function chooseCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  return (
    <>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2" aria-label="Lọc album theo danh mục">
        <FilterButton active={category === "all"} onClick={() => chooseCategory("all")}>Tất cả <span>{albums.length}</span></FilterButton>
        {categories.map((item) => ({ ...item, publicCount: albums.filter((album) => album.categoryId === item.id).length })).filter((item) => item.publicCount > 0).map((item) => <FilterButton key={item.id} active={category === item.slug} onClick={() => chooseCategory(item.slug)}>{item.name} <span>{item.publicCount}</span></FilterButton>)}
      </div>

      {visible.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((album, index) => <ConceptAlbumCard key={album.id} album={album} order={(page - 1) * pageSize + index + 1} priority={page === 1 && index === 0} onOpen={() => setSelected(album)} />)}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 p-10 text-center text-[#8c8174]">Danh mục này chưa có album.</p>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang Album Concept">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="grid size-11 place-items-center rounded-md border border-white/15 disabled:opacity-30" aria-label="Trang trước"><ChevronLeft /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => <button type="button" key={value} onClick={() => setPage(value)} className={`size-11 rounded-md border text-sm font-bold ${page === value ? "border-[#d8b766] bg-[#d8b766] text-[#07080a]" : "border-white/15 text-[#cbc0b0]"}`}>{value}</button>)}
          <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="grid size-11 place-items-center rounded-md border border-white/15 disabled:opacity-30" aria-label="Trang sau"><ChevronRight /></button>
        </nav>
      )}

      {selected && <AlbumViewer album={selected} onClose={() => setSelected(null)} onConsult={() => { setSelected(null); setConsulting(selected); }} />}
      {consulting && <ConsultationModal album={consulting} onClose={() => setConsulting(null)} />}

    </>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${active ? "border-[#d8b766] bg-[#d8b766] text-[#07080a]" : "border-white/15 bg-white/[.03] text-[#cbc0b0] hover:border-[#d8b766]/60 hover:text-white"} [&_span]:text-xs [&_span]:opacity-70`}>{children}</button>;
}

function AlbumViewer({ album, onClose, onConsult }: { album: TloraConceptAlbum; onClose: () => void; onConsult: () => void }) {
  const images = [album.coverImageUrl, ...album.images].filter(Boolean);
  return (
    <div className="fixed inset-0 z-50 bg-[#07080a]/95 backdrop-blur-xl [animation:concept-fade_.25s_ease-out]">
      <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-15 blur-2xl md:hidden" style={{ backgroundImage: `url(${album.coverImageUrl})` }} />
      <div className="relative h-full overflow-y-auto md:p-5">
        <div className="mx-auto min-h-full max-w-7xl [animation:concept-open_.4s_cubic-bezier(.2,.8,.2,1)]">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#07080a]/85 px-4 py-3 backdrop-blur-xl md:rounded-t-xl md:border">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold"><ArrowLeft size={17} /> Thoát</button>
            <div className="min-w-0 text-center"><p className="truncate text-sm font-extrabold">{album.title}</p><p className="text-xs text-[#8c8174]">{images.length} ảnh</p></div>
            <button type="button" onClick={onConsult} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a]"><MessageCircle size={16} /><span className="hidden sm:inline">Tư vấn</span></button>
          </header>

          <div className="md:hidden">
            <div className="flex h-[calc(100dvh-70px)] snap-x snap-mandatory overflow-x-auto">
              {images.map((image, index) => <figure key={`${image}-${index}`} className="relative h-full min-w-full snap-center p-4"><Image src={image} alt={`${album.title} ${index + 1}`} fill sizes="100vw" quality={70} className="object-contain p-4" /><figcaption className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-xs font-bold">{index + 1} / {images.length}</figcaption></figure>)}
            </div>
          </div>

          <div className="hidden border-x border-b border-white/10 bg-[#101115] p-6 md:block">
            <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b766]">{album.categoryName || "Album Concept"}</p><h2 className="mt-3 text-4xl font-black text-[#f8f5ee]">{album.title}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#cbc0b0]">{album.excerpt}</p></div>
            <div className="columns-2 gap-4 lg:columns-3">{images.map((image, index) => <div key={`${image}-${index}`} className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/10"><Image src={image} alt={`${album.title} ${index + 1}`} width={1200} height={900} sizes="(min-width: 1024px) 33vw, 50vw" quality={70} className="h-auto w-full transition duration-500 hover:scale-[1.02]" /></div>)}</div>
          </div>
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="Đóng album" className="absolute right-3 top-20 z-30 hidden size-11 place-items-center rounded-full bg-white text-black shadow-xl md:grid"><X size={20} /></button>
    </div>
  );
}

function ConsultationModal({ album, onClose }: { album: TloraConceptAlbum; onClose: () => void }) {
  const [form, setForm] = useState({ customerName: "", shootingDate: "", phone: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/concept-inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, albumId: album.id }) });
    const result = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) return setMessage(result.error || "Không thể gửi đăng ký.");
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm [animation:concept-fade_.2s_ease-out]">
      <section className="w-full max-w-lg rounded-xl border border-white/10 bg-[#101115] p-6 text-[#f8f5ee] [animation:concept-open_.3s_ease-out]">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">Liên hệ tư vấn</p><h2 className="mt-2 text-2xl font-extrabold">{album.title}</h2></div><button type="button" onClick={onClose} aria-label="Đóng form" className="grid size-10 place-items-center rounded-md border border-white/10"><X size={18} /></button></div>
        {done ? <div className="py-10 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-400 text-black"><Check /></span><h3 className="mt-4 text-xl font-bold">Đã nhận đăng ký</h3><p className="mt-2 text-sm text-[#8c8174]">TLORA sẽ liên hệ tư vấn với bạn sớm nhất.</p></div> : <form onSubmit={submit} className="mt-6 space-y-4"><Input label="Tên" value={form.customerName} onChange={(customerName) => setForm((current) => ({ ...current, customerName }))} required /><Input label="Thời gian chụp" value={form.shootingDate} onChange={(shootingDate) => setForm((current) => ({ ...current, shootingDate }))} type="date" /><Input label="SĐT / Zalo" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} required type="tel" /><label className="block text-sm font-bold">Mô tả<textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Bạn mong muốn phong cách, trang phục hoặc bối cảnh như thế nào?" className="mt-2 min-h-28 w-full rounded-md border border-white/10 bg-[#07080a] p-3 font-normal outline-none focus:border-[#d8b766]" /></label>{message && <p className="text-sm text-red-300">{message}</p>}<button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-[#07080a] disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <MessageCircle size={17} />} Gửi</button></form>}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="block text-sm font-bold">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-[#07080a] px-3 font-normal outline-none focus:border-[#d8b766]" /></label>;
}
