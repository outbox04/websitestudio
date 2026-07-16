"use client";

import { ArrowRight, Check, Loader2, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { TloraConceptAlbum } from "@/types/scope";

export function ConceptAlbumsView({ albums, initialSlug }: { albums: TloraConceptAlbum[]; initialSlug?: string }) {
  const [selected, setSelected] = useState<TloraConceptAlbum | null>(() => albums.find((album) => album.slug === initialSlug) || null);
  const [consulting, setConsulting] = useState<TloraConceptAlbum | null>(null);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {albums.map((album, index) => (
          <article key={album.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101115] opacity-0 [animation:concept-card_.55s_ease-out_forwards]" style={{ animationDelay: `${index * 80}ms` }}>
            <button type="button" onClick={() => setSelected(album)} className="relative block aspect-[4/3] w-full overflow-hidden bg-[#1c1813] text-left">
              <span className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={album.coverImageUrl ? { backgroundImage: `url(${album.coverImageUrl})` } : undefined} />
              <span className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-sm font-bold text-white">Xem thêm album <ArrowRight size={17} /></span>
            </button>
            <div className="p-5">
              <h2 className="text-xl font-extrabold text-[#f8f5ee]">{album.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8c8174]">{album.excerpt}</p>
              <button type="button" onClick={() => setConsulting(album)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a]"><MessageCircle size={16} /> Liên hệ tư vấn</button>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#07080a]/95 p-4 backdrop-blur-md [animation:concept-fade_.25s_ease-out]">
          <div className="mx-auto max-w-6xl [animation:concept-open_.4s_cubic-bezier(.2,.8,.2,1)]">
            <div className="sticky top-4 z-10 flex justify-end"><button type="button" onClick={() => setSelected(null)} aria-label="Đóng album" className="grid size-11 place-items-center rounded-full bg-white text-black shadow-xl"><X size={20} /></button></div>
            <header className="pb-8 pt-2"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b766]">Album Concept</p><h2 className="mt-3 text-4xl font-black text-[#f8f5ee] md:text-6xl">{selected.title}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#cbc0b0]">{selected.excerpt}</p></header>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {[selected.coverImageUrl, ...selected.images].filter(Boolean).map((image, index) => <div key={`${image}-${index}`} className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/10 opacity-0 [animation:concept-card_.5s_ease-out_forwards]" style={{ animationDelay: `${index * 60}ms` }}><Image src={image} alt={`${selected.title} ${index + 1}`} width={1200} height={900} unoptimized className="h-auto w-full" /></div>)}
            </div>
            <button type="button" onClick={() => { setConsulting(selected); setSelected(null); }} className="sticky bottom-5 mx-auto mt-8 flex min-h-12 items-center gap-2 rounded-md bg-[#d8b766] px-6 text-sm font-bold text-[#07080a] shadow-2xl"><MessageCircle size={17} /> Tư vấn concept này</button>
          </div>
        </div>
      )}

      {consulting && <ConsultationModal album={consulting} onClose={() => setConsulting(null)} />}
      <style jsx global>{`
        @keyframes concept-card { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes concept-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes concept-open { from { opacity: 0; transform: scale(.96) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </>
  );
}

function ConsultationModal({ album, onClose }: { album: TloraConceptAlbum; onClose: () => void }) {
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", note: `Tôi muốn được tư vấn album ${album.title}.` });
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
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur-sm [animation:concept-fade_.2s_ease-out]">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101115] p-6 text-[#f8f5ee] [animation:concept-open_.3s_ease-out]">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">Đăng ký tư vấn</p><h2 className="mt-2 text-2xl font-extrabold">{album.title}</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-md border border-white/10"><X size={18} /></button></div>
        {done ? <div className="py-10 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-400 text-black"><Check /></span><h3 className="mt-4 text-xl font-bold">Đã nhận đăng ký</h3><p className="mt-2 text-sm text-[#8c8174]">TLORA sẽ liên hệ tư vấn với bạn sớm nhất.</p></div> : <form onSubmit={submit} className="mt-6 space-y-4"><Input label="Họ và tên" value={form.customerName} onChange={(customerName) => setForm((current) => ({ ...current, customerName }))} required /><Input label="Số điện thoại" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} required /><Input label="Email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} type="email" /><label className="block text-sm font-bold">Nội dung<textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="mt-2 min-h-24 w-full rounded-md border border-white/10 bg-[#07080a] p-3 font-normal outline-none focus:border-[#d8b766]" /></label>{message && <p className="text-sm text-red-300">{message}</p>}<button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-[#07080a] disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <MessageCircle size={17} />} Gửi đăng ký tư vấn</button></form>}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="block text-sm font-bold">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-[#07080a] px-3 font-normal outline-none focus:border-[#d8b766]" /></label>;
}
