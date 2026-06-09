"use client";

import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Download, Expand, ImageOff, Loader2, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Gallery = {
  id: string;
  customer_name: string;
  customer_name_slug: string;
  shoot_date: string;
  cover_url?: string | null;
  raw_drive_folder_url: string;
  edited_drive_folder_url: string;
  raw_download_enabled: boolean;
  edited_download_enabled: boolean;
};

type GalleryPhoto = {
  id: string;
  drive_file_id: string;
  file_name: string;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  download_url?: string | null;
  kind: "raw" | "edited";
  selected: boolean;
  edit_note?: string | null;
};

type Tab = "all" | "selected" | "edited";

export function CustomerGalleryView({
  gallery,
  rawPhotos,
  editedPhotos,
}: {
  gallery: Gallery;
  rawPhotos: GalleryPhoto[];
  editedPhotos: GalleryPhoto[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [photos, setPhotos] = useState(rawPhotos);
  const [preview, setPreview] = useState<GalleryPhoto | null>(null);
  const [syncing, setSyncing] = useState(false);
  const saveTimers = useRef<Record<string, number>>({});

  const selectedPhotos = useMemo(() => photos.filter((photo) => photo.selected), [photos]);
  const visiblePhotos = tab === "selected" ? selectedPhotos : photos;
  const previewPhotos = tab === "edited" ? editedPhotos : visiblePhotos;
  const previewIndex = preview ? previewPhotos.findIndex((photo) => photo.id === preview.id) : -1;
  const cover = gallery.cover_url || photos[0]?.thumbnail_url || editedPhotos[0]?.thumbnail_url;

  const showPreviousPhoto = useCallback(() => {
    if (!preview || previewPhotos.length === 0) return;
    const currentIndex = previewIndex >= 0 ? previewIndex : 0;
    const previousIndex = (currentIndex - 1 + previewPhotos.length) % previewPhotos.length;
    setPreview(previewPhotos[previousIndex]);
  }, [preview, previewIndex, previewPhotos]);

  const showNextPhoto = useCallback(() => {
    if (!preview || previewPhotos.length === 0) return;
    const currentIndex = previewIndex >= 0 ? previewIndex : 0;
    const nextIndex = (currentIndex + 1) % previewPhotos.length;
    setPreview(previewPhotos[nextIndex]);
  }, [preview, previewIndex, previewPhotos]);

  useEffect(() => {
    if (!preview) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        showPreviousPhoto();
      }

      if (event.key === "ArrowRight") {
        showNextPhoto();
      }

      if (event.key === "Escape") {
        setPreview(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [preview, showNextPhoto, showPreviousPhoto]);

  async function patchPhoto(photoId: string, body: { selected?: boolean; editNote?: string }) {
    await fetch(`/api/customer-galleries/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function toggleSelected(photo: GalleryPhoto) {
    const nextSelected = !photo.selected;
    setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, selected: nextSelected } : item));
    void patchPhoto(photo.id, { selected: nextSelected });
  }

  function updateNote(photo: GalleryPhoto, editNote: string) {
    setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, edit_note: editNote } : item));
    window.clearTimeout(saveTimers.current[photo.id]);
    saveTimers.current[photo.id] = window.setTimeout(() => {
      void patchPhoto(photo.id, { editNote });
    }, 450);
  }

  async function syncPhotos() {
    setSyncing(true);
    await fetch(`/api/customer-galleries/${gallery.customer_name_slug}/sync`, { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="bg-stone-50">
      <section className="relative min-h-[360px] overflow-hidden bg-zinc-950 text-white">
        {cover && <Image src={cover} alt={gallery.customer_name} fill priority sizes="100vw" className="object-cover opacity-55" unoptimized />}
        <div className="absolute inset-0 bg-zinc-950/35" />
        <div className="relative mx-auto flex min-h-[360px] max-w-7xl flex-col justify-end px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-200">TLORA Studio Gallery</p>
          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{gallery.customer_name}</h1>
          <p className="mt-4 text-sm text-zinc-200">Ngày chụp: {new Date(gallery.shoot_date).toLocaleDateString("vi-VN")}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Số lượng ảnh" value={photos.length} />
          <Stat label="Ảnh đã chọn" value={selectedPhotos.length} />
          <Stat label="Ảnh chỉnh sửa" value={editedPhotos.length} />
          <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-500">Tải FILE GỐC</p>
            <p className={`mt-2 text-lg font-extrabold ${gallery.raw_download_enabled ? "text-emerald-600" : "text-rose-600"}`}>
              {gallery.raw_download_enabled ? "Đã mở" : "Đang khóa"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-md border border-zinc-200 bg-white p-1">
            {[
              ["all", "Tất cả ảnh"],
              ["selected", "Ảnh đã chọn"],
              ["edited", "File ảnh chỉnh sửa"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value as Tab)}
                className={`rounded px-4 py-2 text-sm font-semibold ${tab === value ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={syncPhotos} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold">
            {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Làm mới ảnh
          </button>
        </div>

        {tab !== "edited" && (
          <>
            <div className="mt-4 flex flex-wrap gap-3">
              {gallery.raw_download_enabled ? (
                <a href={gallery.raw_drive_folder_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                  <Download size={16} /> Tải xuống FILE GỐC
                </a>
              ) : (
                <button disabled className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-600">
                  <Download size={16} /> Tải xuống sau khi thanh toán
                </button>
              )}
            </div>
            <PhotoGrid photos={visiblePhotos} onPreview={setPreview} onToggle={toggleSelected} onNote={updateNote} />
          </>
        )}

        {tab === "edited" && (
          <>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={gallery.edited_drive_folder_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">
                <Download size={16} /> Tải xuống FILE CHỈNH SỬA
              </a>
            </div>
            <EditedGrid photos={editedPhotos} onPreview={setPreview} />
          </>
        )}
      </main>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/90 p-4">
          <div className="relative grid h-[92vh] w-full max-w-7xl overflow-hidden rounded-md bg-zinc-900 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="relative min-h-[55vh] lg:min-h-0">
              {preview.preview_url || preview.thumbnail_url ? (
                <Image src={preview.preview_url || preview.thumbnail_url || ""} alt={preview.file_name} fill sizes="(min-width: 1024px) calc(100vw - 360px), 100vw" className="object-contain" unoptimized />
              ) : (
                <div className="grid h-full place-items-center text-white">Không có preview</div>
              )}
            </div>
            <aside className="border-t border-white/10 bg-white p-4 text-zinc-950 lg:border-l lg:border-t-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">{preview.kind === "edited" ? "File chỉnh sửa" : "File gốc"}</p>
                  <h2 className="mt-2 break-words text-lg font-bold">{preview.file_name}</h2>
                </div>
              </div>
              {preview.kind === "raw" ? (
                <div className="mt-5 space-y-4">
                  <button
                    onClick={() => {
                      toggleSelected(preview);
                      setPreview((current) => current ? { ...current, selected: !current.selected } : current);
                    }}
                    className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${preview.selected ? "bg-emerald-600 text-white" : "bg-zinc-950 text-white"}`}
                  >
                    {preview.selected ? <Check size={18} /> : <span className="size-4 rounded border border-current" />}
                    {preview.selected ? "Đã chọn ảnh này" : "Chọn ảnh này"}
                  </button>
                  <label className="block text-sm font-semibold" htmlFor={`modal-note-${preview.id}`}>
                    Mô tả cần chỉnh sửa
                  </label>
                  <textarea
                    id={`modal-note-${preview.id}`}
                    value={preview.edit_note || ""}
                    onChange={(event) => {
                      const editNote = event.target.value;
                      updateNote(preview, editNote);
                      setPreview((current) => current ? { ...current, edit_note: editNote } : current);
                    }}
                    placeholder="Ví dụ: làm da nhẹ, giữ màu tóc, crop ngang..."
                    className="min-h-40 w-full resize-none rounded-md border border-zinc-200 bg-stone-50 p-3 text-sm outline-none focus:border-zinc-900 focus:bg-white"
                  />
                  <p className="text-xs font-medium text-emerald-700">Ghi chú tự động lưu khi khách nhập.</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <p className="text-sm leading-6 text-zinc-600">Ảnh đã chỉnh sửa từ thư mục FILE CHỈNH SỬA.</p>
                  {preview.download_url && (
                    <a href={preview.download_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white">
                      <Download size={16} /> Tải ảnh
                    </a>
                  )}
                </div>
              )}
            </aside>
            <button onClick={() => setPreview(null)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-md bg-white text-zinc-950 shadow">
              <X size={20} />
            </button>
            {previewPhotos.length > 1 && (
              <>
                <button
                  onClick={showPreviousPhoto}
                  className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-zinc-950 shadow-lg transition hover:bg-white md:left-5"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  onClick={showNextPhoto}
                  className="absolute right-3 top-[30%] grid size-12 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-zinc-950 shadow-lg transition hover:bg-white md:right-5 lg:right-[380px] lg:top-1/2"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight size={26} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-zinc-950/75 px-3 py-2 text-sm font-semibold text-white">
                  {Math.max(previewIndex + 1, 1)} / {previewPhotos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function PhotoGrid({
  photos,
  onPreview,
  onToggle,
  onNote,
}: {
  photos: GalleryPhoto[];
  onPreview: (photo: GalleryPhoto) => void;
  onToggle: (photo: GalleryPhoto) => void;
  onNote: (photo: GalleryPhoto, note: string) => void;
}) {
  if (photos.length === 0) {
    return <EmptyState text="Chưa có ảnh trong FILE GỐC hoặc chưa đồng bộ ảnh." />;
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <article key={photo.id} className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="relative aspect-[4/5] bg-zinc-100">
            {photo.thumbnail_url ? <Image src={photo.thumbnail_url} alt={photo.file_name} fill sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" unoptimized /> : <EmptyImage />}
            <button onClick={() => onPreview(photo)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-md bg-white/95 text-zinc-950 shadow" aria-label="Xem lớn">
              <Expand size={18} />
            </button>
            <button onClick={() => onToggle(photo)} className={`absolute left-3 top-3 flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold shadow ${photo.selected ? "bg-emerald-600 text-white" : "bg-white/95 text-zinc-950"}`}>
              {photo.selected ? <Check size={18} /> : <span className="size-4 rounded border border-zinc-400" />}
              {photo.selected ? "Đã chọn" : "Chọn ảnh"}
            </button>
          </div>
          <div className="p-4">
            <h3 className="truncate font-semibold">{photo.file_name}</h3>
            <label className="mt-3 block text-sm font-medium text-zinc-700">Mô tả cần chỉnh sửa</label>
            <textarea
              value={photo.edit_note || ""}
              onChange={(event) => onNote(photo, event.target.value)}
              placeholder="Ví dụ: làm da nhẹ, giữ màu tóc, crop ngang..."
              className="mt-2 min-h-24 w-full resize-none rounded-md border border-zinc-200 bg-stone-50 p-3 text-sm outline-none focus:border-zinc-900 focus:bg-white"
            />
            <p className="mt-2 text-xs font-medium text-emerald-700">Tự động lưu ghi chú</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function EditedGrid({ photos, onPreview }: { photos: GalleryPhoto[]; onPreview: (photo: GalleryPhoto) => void }) {
  if (photos.length === 0) {
    return <EmptyState text="Chưa có ảnh trong FILE CHỈNH SỬA." />;
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <article key={photo.id} className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="relative aspect-[4/5] bg-zinc-100">
            {photo.thumbnail_url ? <Image src={photo.thumbnail_url} alt={photo.file_name} fill sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" unoptimized /> : <EmptyImage />}
            <button onClick={() => onPreview(photo)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-md bg-white/95 text-zinc-950 shadow" aria-label="Xem lớn">
              <Expand size={18} />
            </button>
          </div>
          <div className="p-4">
            <h3 className="truncate font-semibold">{photo.file_name}</h3>
            {photo.download_url && (
              <a href={photo.download_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white">
                <Download size={16} /> Tải ảnh
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 grid min-h-64 place-items-center rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
      <div>
        <ImageOff className="mx-auto" size={38} />
        <p className="mt-3 text-sm font-semibold">{text}</p>
      </div>
    </div>
  );
}

function EmptyImage() {
  return (
    <div className="grid h-full place-items-center text-zinc-400">
      <ImageOff size={32} />
    </div>
  );
}
