"use client";

/* eslint-disable @next/next/no-img-element -- Media URLs come from the studio's runtime Supabase bucket and are already optimized to WebP before upload. */

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Save, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { optimizeImageForWeb } from "@/lib/client/image-optimizer";
import type { TloraCmsMediaAsset } from "@/types/scope";

const PAGE_SIZE = 35;

function imageName(value: string) {
  return value.trim().replace(/\.(?:jpe?g|png|webp)$/i, "");
}

function albumBaseName(value: string) {
  return imageName(value).replace(/^album\s+/i, "");
}

export function TloraMediaManager({ initialMedia }: { initialMedia: TloraCmsMediaAsset[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadName, setUploadName] = useState("");
  const [selected, setSelected] = useState<TloraCmsMediaAsset | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const pageCount = Math.max(1, Math.ceil(media.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleMedia = useMemo(
    () => media.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, media],
  );

  function chooseFiles(files: FileList | null) {
    const nextFiles = Array.from(files || []);
    if (!nextFiles.length) return;
    setPendingFiles(nextFiles);
    setUploadName(nextFiles.length === 1 ? imageName(nextFiles[0].name) : "");
    setMessage("");
  }

  function closeUpload() {
    if (busy === "upload") return;
    setPendingFiles([]);
    setUploadName("");
  }

  async function upload() {
    const baseName = pendingFiles.length > 1 ? albumBaseName(uploadName) : imageName(uploadName);
    if (!baseName) {
      setMessage(pendingFiles.length > 1 ? "Vui lòng nhập tên album." : "Vui lòng nhập alt cho ảnh.");
      return;
    }

    setBusy("upload");
    setMessage("");
    const uploaded: TloraCmsMediaAsset[] = [];
    const failed: string[] = [];

    for (const [index, file] of pendingFiles.entries()) {
      let previewUrl = "";
      try {
        const optimized = await optimizeImageForWeb(file);
        previewUrl = optimized.previewUrl;
        const altText = pendingFiles.length === 1
          ? baseName
          : `${baseName} ${String(index + 1).padStart(2, "0")}`;
        const uploadFile = new File([optimized.file], `${altText}.webp`, { type: optimized.file.type });
        const form = new FormData();
        form.set("file", uploadFile);
        form.set("altText", altText);
        form.set("width", String(optimized.width));
        form.set("height", String(optimized.height));
        const response = await fetch("/api/admin/tlora/media", { method: "POST", body: form });
        const result = await response.json() as { media?: TloraCmsMediaAsset; error?: string };
        if (!response.ok || !result.media) throw new Error(result.error || "Không thể upload ảnh.");
        uploaded.push(result.media);
      } catch {
        failed.push(file.name);
      } finally {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    }

    if (uploaded.length) {
      setMedia((current) => [...uploaded, ...current]);
      setPage(1);
    }
    setBusy("");
    setPendingFiles([]);
    setUploadName("");
    setMessage(
      failed.length
        ? `Đã tải lên ${uploaded.length}/${pendingFiles.length} ảnh. Không thể tải: ${failed.join(", ")}.`
        : `Đã tối ưu và tải lên ${uploaded.length} ảnh.`,
    );
  }

  function openEditor(asset: TloraCmsMediaAsset) {
    setSelected(asset);
    setEditAlt(asset.altText || imageName(asset.fileName));
    setEditDescription(asset.description || "");
    setMessage("");
  }

  async function saveMetadata() {
    if (!selected || !editAlt.trim()) {
      setMessage("Alt ảnh không được để trống.");
      return;
    }
    setBusy("save");
    try {
      const response = await fetch("/api/admin/tlora/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, altText: editAlt.trim(), description: editDescription.trim() }),
      });
      const result = await response.json() as { media?: TloraCmsMediaAsset; error?: string };
      if (!response.ok || !result.media) throw new Error(result.error || "Không thể lưu thông tin ảnh.");
      setMedia((current) => current.map((asset) => asset.id === result.media?.id ? result.media! : asset));
      setSelected(result.media);
      setMessage("Đã lưu thông tin ảnh.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu thông tin ảnh.");
    } finally {
      setBusy("");
    }
  }

  async function remove(asset: TloraCmsMediaAsset) {
    if (!window.confirm(`Xóa ${asset.altText || asset.fileName}?`)) return;
    setBusy(asset.id);
    try {
      const response = await fetch(`/api/admin/tlora/media?id=${asset.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setMedia((current) => current.filter((item) => item.id !== asset.id));
      if (selected?.id === asset.id) setSelected(null);
      setMessage("Đã xóa ảnh.");
    } catch {
      setMessage("Không thể xóa ảnh.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">TLORA assets</p>
          <h1 className="mt-2 text-3xl font-extrabold">Media Library</h1>
          <p className="mt-2 text-sm text-zinc-600">Ảnh được tự động thu về tối đa 1920px, chuyển WebP và giữ nguyên tỷ lệ khi hiển thị.</p>
        </div>
        <>
          <input
            ref={input}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              chooseFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <button type="button" onClick={() => input.current?.click()} disabled={Boolean(busy)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-50">
            <ImagePlus size={17} /> Tải ảnh lên
          </button>
        </>
      </header>

      {message && <p className="mt-5 rounded-md border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700" role="status">{message}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {visibleMedia.map((asset) => (
          <article key={asset.id} className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <button type="button" onClick={() => openEditor(asset)} className="block w-full text-left" aria-label={`Xem và chỉnh sửa ${asset.altText || asset.fileName}`}>
              <span className="flex aspect-[4/3] items-center justify-center bg-zinc-100 p-2">
                {asset.publicUrl
                  ? <img src={asset.publicUrl} alt={asset.altText || ""} className="h-full w-full object-contain" loading="lazy" />
                  : <ImagePlus className="text-zinc-300" size={32} />}
              </span>
              <span className="block p-3 pr-11">
                <span className="block truncate text-sm font-bold">{asset.altText || imageName(asset.fileName)}</span>
                <span className="mt-1 block text-xs text-zinc-500">{asset.width && asset.height ? `${asset.width} × ${asset.height}px · ` : ""}{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void remove(asset)}
              disabled={busy === asset.id}
              aria-label={`Xóa ${asset.altText || asset.fileName}`}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border border-white/70 bg-black/75 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              {busy === asset.id ? <Loader2 className="animate-spin" size={15} /> : <X size={16} />}
            </button>
          </article>
        ))}
      </div>

      {!media.length && <p className="mt-6 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">Thư viện chưa có ảnh.</p>}

      {pageCount > 1 && (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang thư viện ảnh">
          <button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Trang trước" className="grid size-10 place-items-center rounded-md border border-zinc-300 bg-white disabled:opacity-40"><ChevronLeft size={18} /></button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <button key={number} type="button" onClick={() => setPage(number)} aria-current={number === currentPage ? "page" : undefined} className={`min-h-10 min-w-10 rounded-md px-3 text-sm font-bold ${number === currentPage ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white text-zinc-700"}`}>{number}</button>
          ))}
          <button type="button" onClick={() => setPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount} aria-label="Trang sau" className="grid size-10 place-items-center rounded-md border border-zinc-300 bg-white disabled:opacity-40"><ChevronRight size={18} /></button>
        </nav>
      )}

      {pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="w-full max-w-lg rounded-xl border border-[#2a2722] bg-[#101115] p-5 text-[#f8f5ee] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="upload-title" className="text-xl font-extrabold">{pendingFiles.length === 1 ? "Thông tin ảnh" : `Tải album ${pendingFiles.length} ảnh`}</h2><p className="mt-1 text-sm text-[#8c8174]">{pendingFiles.length === 1 ? "Nhập alt bắt buộc trước khi tải ảnh." : "Tên ảnh sẽ được đánh số tự động và không hiển thị đuôi file."}</p></div>
              <button type="button" onClick={closeUpload} disabled={busy === "upload"} aria-label="Đóng" className="grid size-9 shrink-0 place-items-center rounded-md border border-white/10"><X size={17} /></button>
            </div>
            <label className="mt-5 block text-sm font-bold">{pendingFiles.length === 1 ? "Alt ảnh" : "Tên album"}<input autoFocus value={uploadName} onChange={(event) => setUploadName(event.target.value)} maxLength={pendingFiles.length === 1 ? 300 : 290} placeholder={pendingFiles.length === 1 ? "Ví dụ: Chân dung cô dâu" : "Ví dụ: Album AURA"} className="mt-2 min-h-11 w-full rounded-md border border-white/15 bg-[#07080a] px-3 font-normal text-white outline-none focus:border-[#d8b766]" /></label>
            {pendingFiles.length > 1 && albumBaseName(uploadName) && <p className="mt-2 text-xs text-[#cbc0b0]">Tên tạo tự động: {albumBaseName(uploadName)} 01 → {albumBaseName(uploadName)} {String(pendingFiles.length).padStart(2, "0")}</p>}
            {message && <p className="mt-3 text-xs font-semibold text-red-300" role="status">{message}</p>}
            <div className="mt-4 max-h-36 overflow-y-auto rounded-md bg-white/[.04] p-3 text-xs leading-6 text-[#cbc0b0]">{pendingFiles.map((file) => <p key={`${file.name}-${file.lastModified}`} className="truncate">{file.name}</p>)}</div>
            <button type="button" onClick={() => void upload()} disabled={busy === "upload" || !uploadName.trim()} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-40">{busy === "upload" ? <Loader2 className="animate-spin" size={17} /> : <ImagePlus size={17} />}{busy === "upload" ? "Đang tối ưu và tải ảnh…" : `Tải lên ${pendingFiles.length} ảnh`}</button>
          </section>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-title" className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-[#2a2722] bg-[#101115] text-[#f8f5ee] shadow-2xl lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-h-72 items-center justify-center overflow-auto bg-[#07080a] p-5 lg:min-h-[640px]">
              {selected.publicUrl && <img src={selected.publicUrl} alt={editAlt} className="max-h-[80vh] max-w-full object-contain" />}
            </div>
            <aside className="overflow-y-auto border-t border-white/10 p-5 lg:border-l lg:border-t-0">
              <div className="flex items-start justify-between gap-4"><div><h2 id="edit-title" className="text-xl font-extrabold">Xem và chỉnh sửa ảnh</h2><p className="mt-1 text-xs text-[#8c8174]">{selected.width || "—"} × {selected.height || "—"}px · {(selected.sizeBytes / 1024).toFixed(0)} KB</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Đóng" className="grid size-9 shrink-0 place-items-center rounded-md border border-white/10"><X size={17} /></button></div>
              <label className="mt-6 block text-sm font-bold">Alt ảnh<input value={editAlt} onChange={(event) => setEditAlt(event.target.value)} maxLength={300} className="mt-2 min-h-11 w-full rounded-md border border-white/15 bg-[#07080a] px-3 font-normal text-white outline-none focus:border-[#d8b766]" /></label>
              <label className="mt-4 block text-sm font-bold">Mô tả<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={1000} rows={5} className="mt-2 w-full resize-y rounded-md border border-white/15 bg-[#07080a] p-3 font-normal text-white outline-none focus:border-[#d8b766]" /></label>
              {message && <p className="mt-3 text-xs font-semibold text-[#cbc0b0]" role="status">{message}</p>}
              <button type="button" onClick={() => void saveMetadata()} disabled={busy === "save" || !editAlt.trim()} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-40">{busy === "save" ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Lưu thay đổi</button>
            </aside>
          </section>
        </div>
      )}
    </main>
  );
}
