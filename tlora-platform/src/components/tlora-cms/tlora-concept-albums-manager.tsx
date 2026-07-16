"use client";

import { Check, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { conceptAlbumSchema } from "@/schemas/tlora-cms";
import type { TloraCmsMediaAsset, TloraConceptAlbum } from "@/types/scope";

type AlbumForm = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  images: string[];
  isFeatured: boolean;
  sortOrder: number;
  status: TloraConceptAlbum["status"];
};

const emptyForm: AlbumForm = {
  title: "", slug: "", excerpt: "", coverImageUrl: "", images: [],
  isFeatured: false, sortOrder: 0, status: "draft",
};

export function TloraConceptAlbumsManager({ initialAlbums, media }: { initialAlbums: TloraConceptAlbum[]; media: TloraCmsMediaAsset[] }) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [form, setForm] = useState<AlbumForm>(emptyForm);
  const [message, setMessage] = useState("");

  function edit(album: TloraConceptAlbum) {
    setForm({
      id: album.id, title: album.title, slug: album.slug, excerpt: album.excerpt,
      coverImageUrl: album.coverImageUrl, images: album.images, isFeatured: album.isFeatured,
      sortOrder: album.sortOrder, status: album.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    const parsed = conceptAlbumSchema.safeParse(form);
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Album không hợp lệ.");
    const response = await fetch("/api/admin/tlora/concept-albums", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
    });
    const result = await response.json() as { album?: TloraConceptAlbum; error?: string };
    if (!response.ok || !result.album) return setMessage(result.error || "Không thể lưu album.");
    setAlbums((current) => [result.album!, ...current.filter((album) => album.id !== result.album?.id)]);
    setForm(emptyForm);
    setMessage("Đã lưu Album Concept.");
  }

  async function remove(album: TloraConceptAlbum) {
    if (!window.confirm(`Xóa album ${album.title}?`)) return;
    const response = await fetch(`/api/admin/tlora/concept-albums?id=${album.id}`, { method: "DELETE" });
    if (response.ok) setAlbums((current) => current.filter((item) => item.id !== album.id));
  }

  function toggleGalleryImage(url: string) {
    setForm((current) => ({
      ...current,
      images: current.images.includes(url) ? current.images.filter((image) => image !== url) : [...current.images, url].slice(0, 30),
    }));
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Concept Library</p>
      <h1 className="mt-2 text-3xl font-extrabold">Album Concept</h1>
      <p className="mt-2 text-sm text-zinc-600">Tối đa 6 album được đánh dấu nổi bật sẽ đồng bộ vào “Album chọn lọc” trên trang chủ.</p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên album" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title, slug: current.id ? current.slug : slugify(title) }))} />
          <Field label="Slug" value={form.slug} onChange={(slug) => setForm((current) => ({ ...current, slug }))} />
          <div className="md:col-span-2"><Field label="Mô tả ngắn" value={form.excerpt} onChange={(excerpt) => setForm((current) => ({ ...current, excerpt }))} textarea /></div>
          <label className="block text-sm font-bold">Trạng thái<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AlbumForm["status"] }))} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal"><option value="draft">Bản nháp</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
          <Field label="Thứ tự" value={String(form.sortOrder)} onChange={(value) => setForm((current) => ({ ...current, sortOrder: Number(value) || 0 }))} />
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} /> Album nổi bật trên trang chủ</label>
        </div>

        <p className="mt-6 text-sm font-bold">Chọn ảnh bìa</p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {media.filter((asset) => asset.publicUrl).map((asset) => <button key={`cover-${asset.id}`} type="button" onClick={() => setForm((current) => ({ ...current, coverImageUrl: asset.publicUrl || "" }))} className={`relative aspect-square rounded-lg border-2 bg-cover bg-center ${form.coverImageUrl === asset.publicUrl ? "border-[#a57f2c]" : "border-transparent"}`} style={{ backgroundImage: `url(${asset.publicUrl})` }}>{form.coverImageUrl === asset.publicUrl && <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-[#d8b766]"><Check size={13} /></span>}</button>)}
        </div>

        <p className="mt-6 text-sm font-bold">Ảnh trong album ({form.images.length}/30)</p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {media.filter((asset) => asset.publicUrl).map((asset) => <button key={`gallery-${asset.id}`} type="button" onClick={() => toggleGalleryImage(asset.publicUrl || "")} className={`relative aspect-square rounded-lg border-2 bg-cover bg-center ${asset.publicUrl && form.images.includes(asset.publicUrl) ? "border-[#a57f2c]" : "border-transparent"}`} style={{ backgroundImage: `url(${asset.publicUrl})` }}>{asset.publicUrl && form.images.includes(asset.publicUrl) && <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-[#d8b766]"><Check size={13} /></span>}</button>)}
        </div>

        {message && <p className="mt-4 text-sm font-semibold text-zinc-600">{message}</p>}
        <div className="mt-5 flex gap-2 border-t border-zinc-200 pt-5">
          <button type="button" onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white"><Save size={16} /> Lưu album</button>
          <button type="button" onClick={() => setForm(emptyForm)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 px-5 text-sm font-bold"><Plus size={16} /> Album mới</button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {albums.map((album) => (
          <article key={album.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <button type="button" onClick={() => edit(album)} className="block aspect-[16/10] w-full bg-zinc-100 bg-cover bg-center text-left" style={album.coverImageUrl ? { backgroundImage: `url(${album.coverImageUrl})` } : undefined} />
            <div className="p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{album.title}</h2><p className="mt-1 text-xs text-zinc-500">{album.status} · {album.images.length} ảnh {album.isFeatured ? "· Nổi bật" : ""}</p></div><button type="button" onClick={() => remove(album)} aria-label="Xóa album" className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700"><Trash2 size={15} /></button></div></div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  return <label className="block text-sm font-bold">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal" />}</label>;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
