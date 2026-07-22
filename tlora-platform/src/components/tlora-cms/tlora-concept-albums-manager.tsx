"use client";

import { ImagePlus, Pencil, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { TloraImagePicker } from "@/components/tlora-cms/tlora-image-picker";
import { TloraImageCropper } from "@/components/tlora-cms/tlora-og-image-cropper";
import { conceptAlbumSchema } from "@/schemas/tlora-cms";
import type { TloraCmsMediaAsset, TloraConceptAlbum, TloraConceptCategory } from "@/types/scope";

type AlbumForm = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  images: string[];
  tags: string;
  categoryId: string | null;
};

const emptyForm: AlbumForm = { title: "", slug: "", excerpt: "", coverImageUrl: "", images: [], tags: "", categoryId: null };

export function TloraConceptAlbumsManager({
  initialAlbums,
  initialMedia,
  categories,
}: {
  initialAlbums: TloraConceptAlbum[];
  initialMedia: TloraCmsMediaAsset[];
  categories: TloraConceptCategory[];
}) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [media, setMedia] = useState(initialMedia);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<AlbumForm>(emptyForm);
  const [picker, setPicker] = useState<"cover" | "content" | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pages = Math.max(1, Math.ceil(albums.length / pageSize));
  const rows = useMemo(() => albums.slice((page - 1) * pageSize, page * pageSize), [albums, page, pageSize]);

  function edit(album: TloraConceptAlbum) {
    setForm({
      id: album.id,
      title: album.title,
      slug: album.slug,
      excerpt: album.excerpt,
      coverImageUrl: album.coverImageUrl,
      images: album.images,
      tags: album.tags.join(", "),
      categoryId: album.categoryId,
    });
    setMessage(`Đang chỉnh sửa “${album.title}”.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    const parsed = conceptAlbumSchema.safeParse({ ...form, images: form.images.filter((url) => url !== form.coverImageUrl), tags: parseTags(form.tags) });
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Album chưa hợp lệ.");
    setBusy(true);
    const response = await fetch("/api/admin/tlora/concept-albums", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = await response.json() as { album?: TloraConceptAlbum; error?: string };
    setBusy(false);
    if (!response.ok || !result.album) return setMessage(result.error || "Không thể lưu album.");
    setAlbums((current) => [...current.filter((album) => album.id !== result.album?.id), result.album!].sort((a, b) => a.sortOrder - b.sortOrder));
    setForm(emptyForm);
    setMessage("Đã lưu và hiển thị Album Concept.");
  }

  async function remove(album: TloraConceptAlbum) {
    if (!window.confirm(`Xóa album “${album.title}”?`)) return;
    const response = await fetch(`/api/admin/tlora/concept-albums?id=${album.id}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Không thể xóa album.");
    setAlbums((current) => current.filter((item) => item.id !== album.id));
    if (form.id === album.id) setForm(emptyForm);
  }

  function applyPickedImage(url: string) {
    if (picker === "cover") setForm((current) => ({ ...current, coverImageUrl: url, images: current.images.filter((image) => image !== url) }));
    if (picker === "content") setForm((current) => url === current.coverImageUrl || current.images.includes(url) ? current : ({ ...current, images: [...current.images, url].slice(0, 60) }));
    setPicker(null);
  }

  function applyPickedImages(urls: string[]) {
    setForm((current) => ({ ...current, images: [...new Set([...current.images, ...urls.filter((url) => url !== current.coverImageUrl)])].slice(0, 60) }));
    setPicker(null);
  }

  async function applyCroppedCover(coverImageUrl: string) {
    const nextForm = { ...form, coverImageUrl, images: form.images.filter((url) => url !== coverImageUrl) };
    setForm(nextForm);
    if (!nextForm.id) {
      setMessage("Đã căn ảnh bìa. Hãy lưu album để đồng bộ ra website.");
      return;
    }
    const parsed = conceptAlbumSchema.safeParse({ ...nextForm, tags: parseTags(nextForm.tags) });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Album chưa hợp lệ.");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/tlora/concept-albums", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json() as { album?: TloraConceptAlbum; error?: string };
      if (!response.ok || !result.album) throw new Error(result.error || "Không thể đồng bộ ảnh bìa album.");
      setAlbums((current) => [...current.filter((album) => album.id !== result.album?.id), result.album!].sort((a, b) => a.sortOrder - b.sortOrder));
      setMessage("Đã lưu và đồng bộ ảnh bìa mới ra trang chủ và Album Concept.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Thư viện Concept</p>
      <h1 className="mt-2 text-3xl font-extrabold">Album</h1>
      <p className="mt-2 text-sm text-zinc-600">Album được xuất bản ngay sau khi lưu và hiển thị theo thứ tự trong thư viện.</p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên Album" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title, slug: albumSlug(title) }))} />
          <Field label="Tên đường dẫn" value={form.slug} onChange={(slug) => setForm((current) => ({ ...current, slug: albumSlug(slug.replace(/^album-/, "")) }))} helper="Tự động theo mẫu album-ten-album" />
          <div className="md:col-span-2"><Field label="Mô tả ngắn" value={form.excerpt} onChange={(excerpt) => setForm((current) => ({ ...current, excerpt }))} textarea /></div>
          <div className="md:col-span-2"><Field label="Tags phong cách" value={form.tags} onChange={(tags) => setForm((current) => ({ ...current, tags }))} helper="Tối đa 6 tags, ngăn cách bằng dấu phẩy. Ví dụ: Bridal Editorial, Soft Luxury, Studio" /></div>
          <label className="block text-sm font-bold">Danh mục Concept<select value={form.categoryId || ""} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value || null }))} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 font-normal outline-none focus:border-[#a57f2c]"><option value="">Chưa phân loại</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Ảnh bìa</p><p className="mt-1 text-xs text-zinc-500">Khung chuẩn 16:9. Kéo ảnh và thu phóng để giữ đúng vùng quan trọng.</p></div><button type="button" onClick={() => setPicker("cover")} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 px-3 text-xs font-bold"><ImagePlus size={15} /> {form.coverImageUrl ? "Thay ảnh" : "Chọn hoặc Upload"}</button></div>
            {form.coverImageUrl ? <TloraImageCropper key={`album-cover:${form.coverImageUrl}`} imageUrl={form.coverImageUrl} filePrefix={`album-cover-${form.slug || "concept"}`} altText={form.title || "Ảnh bìa album"} variant="light" outputWidth={1200} outputHeight={675} saveLabel={form.id ? "Lưu và đồng bộ ảnh bìa 16:9" : "Lưu ảnh bìa 16:9"} registerInLibrary={false} onApplied={applyCroppedCover} /> : <button type="button" onClick={() => setPicker("cover")} className="mt-3 grid aspect-video w-full place-items-center rounded-lg border border-dashed border-zinc-300 bg-zinc-100 text-sm font-bold text-zinc-500"><span><ImagePlus className="mx-auto mb-2" />Chọn ảnh bìa từ thư viện hoặc tải lên</span></button>}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Nội dung ảnh ({form.images.length}/60)</p><p className="mt-1 text-xs text-zinc-500">Mỗi lần có thể chọn từ thư viện hoặc tải ảnh mới.</p></div><button type="button" onClick={() => setPicker("content")} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-3 text-xs font-bold text-white"><ImagePlus size={15} /> {form.images.length ? "Thêm mới" : "Chọn hoặc Upload"}</button></div>
            {form.images.length ? <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">{form.images.map((url, index) => <div key={`${url}-${index}`} className="relative aspect-square rounded-lg border border-zinc-200 bg-zinc-100 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }}><button type="button" onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))} aria-label={`Xóa ảnh ${index + 1}`} className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border-2 border-white bg-red-600 text-white shadow"><X size={14} /></button></div>)}</div> : <button type="button" onClick={() => setPicker("content")} className="mt-3 grid min-h-44 w-full place-items-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-zinc-500"><span><ImagePlus className="mx-auto mb-2" />Thêm ảnh cho album</span></button>}
          </div>
        </div>

        {message && <p className="mt-4 rounded-md bg-zinc-50 p-3 text-sm font-semibold text-zinc-600">{message}</p>}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-200 pt-5">
          <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white disabled:opacity-50"><Save size={16} /> {form.id ? "Lưu thay đổi" : "Lưu album"}</button>
          {form.id && <button type="button" onClick={() => { setForm(emptyForm); setMessage(""); }} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 px-5 text-sm font-bold"><X size={16} /> Hủy chỉnh sửa</button>}
        </div>
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-zinc-50"><tr><th className="p-3">Ảnh bìa</th><th>Tên và mô tả</th><th>Danh mục</th><th>Số ảnh</th><th>Tên đường dẫn</th><th>Ngày cập nhật</th><th className="pr-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-zinc-100">{rows.map((album) => <tr key={album.id}><td className="p-3"><div className="h-14 w-24 rounded bg-zinc-100 bg-cover bg-center" style={album.coverImageUrl ? { backgroundImage: `url(${album.coverImageUrl})` } : undefined} /></td><td className="max-w-sm"><p className="font-bold">{album.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{album.excerpt || "Chưa có mô tả"}</p></td><td>{album.categoryName || "Chưa phân loại"}</td><td>{album.images.length}</td><td className="font-mono text-xs">/{album.slug}</td><td>{new Date(album.updatedAt).toLocaleDateString("vi-VN")}</td><td className="pr-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => edit(album)} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-300 px-3 text-xs font-bold"><Pencil size={14} /> Chỉnh sửa</button><button type="button" onClick={() => remove(album)} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-bold text-red-700"><Trash2 size={14} /> Xóa</button></div></td></tr>)}</tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="min-h-10 rounded-md border bg-white px-3">{[10, 20, 50, 100].map((size) => <option key={size}>{size}</option>)}</select><div className="flex flex-wrap gap-1"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="size-9 rounded border bg-white disabled:opacity-30">&lt;</button>{Array.from({ length: pages }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setPage(value)} className={`size-9 rounded border ${page === value ? "bg-zinc-950 text-white" : "bg-white"}`}>{value}</button>)}<button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="size-9 rounded border bg-white disabled:opacity-30">&gt;</button></div></div>

      {picker && <TloraImagePicker target={{ sectionKey: "concept-album", field: picker, currentUrl: picker === "cover" ? form.coverImageUrl : "" }} assets={picker === "content" ? media.filter((asset) => asset.publicUrl !== form.coverImageUrl) : media} multiple={picker === "content"} onClose={() => setPicker(null)} onApply={applyPickedImage} onApplyMany={applyPickedImages} onUploaded={(asset) => setMedia((current) => [asset, ...current])} />}
    </main>
  );
}

function Field({ label, value, onChange, textarea = false, helper }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; helper?: string }) {
  return <label className="block text-sm font-bold">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 p-3 font-normal outline-none focus:border-[#a57f2c]" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-[#a57f2c]" />}{helper && <span className="mt-1 block text-xs font-normal text-zinc-500">{helper}</span>}</label>;
}

function albumSlug(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized ? `album-${normalized}` : "";
}

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 6);
}
