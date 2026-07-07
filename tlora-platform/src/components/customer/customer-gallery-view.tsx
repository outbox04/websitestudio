"use client";

import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Image as ImageIcon,
  ImageOff,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Search,
  Share2,
  UploadCloud,
  X,
} from "lucide-react";
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
  total_cost_vnd: number;
  deposit_paid_vnd: number;
  payment_status: "unpaid" | "pending" | "paid";
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

type Tab = "all" | "selected" | "noted" | "edited";

const tabs: Array<{ value: Tab; label: string; icon: typeof ImageIcon }> = [
  { value: "all", label: "Tất cả", icon: ImageIcon },
  { value: "selected", label: "Đã chọn", icon: MessageSquare },
  { value: "noted", label: "Cần chỉnh sửa", icon: Edit3 },
  { value: "edited", label: "File đã chỉnh", icon: UploadCloud },
];

export function CustomerGalleryView({
  gallery,
  rawPhotos,
  editedPhotos,
  initialTab = "all",
}: {
  gallery: Gallery;
  rawPhotos: GalleryPhoto[];
  editedPhotos: GalleryPhoto[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [photos, setPhotos] = useState(rawPhotos);
  const [preview, setPreview] = useState<GalleryPhoto | null>(null);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowPaused, setSlideshowPaused] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState("");
  const saveTimers = useRef<Record<string, number>>({});
  const autoSyncStarted = useRef(false);
  const syncInFlight = useRef(false);

  const selectedPhotos = useMemo(() => photos.filter((photo) => photo.selected), [photos]);
  const notedPhotos = useMemo(() => photos.filter((photo) => Boolean(photo.edit_note?.trim())), [photos]);
  const visiblePhotos = useMemo(() => {
    const rawSource = tab === "selected" ? selectedPhotos : tab === "noted" ? notedPhotos : photos;
    const source = tab === "edited" ? editedPhotos : rawSource;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return source;
    return source.filter((photo) => photo.file_name.toLowerCase().includes(normalizedQuery));
  }, [editedPhotos, notedPhotos, photos, query, selectedPhotos, tab]);
  const previewPhotos = useMemo(() => (visiblePhotos.length > 0 ? visiblePhotos : tab === "edited" ? editedPhotos : photos), [editedPhotos, photos, tab, visiblePhotos]);
  const previewIndex = preview ? previewPhotos.findIndex((photo) => photo.id === preview.id) : -1;
  const cover = gallery.cover_url || photos[0]?.thumbnail_url || editedPhotos[0]?.thumbnail_url;
  const shootDate = new Date(gallery.shoot_date).toLocaleDateString("vi-VN");
  const remaining = Math.max(gallery.total_cost_vnd - gallery.deposit_paid_vnd, 0);

  async function payRemaining() {
    const response = await fetch(`/api/customer-galleries/${gallery.customer_name_slug}/payment`, { method: "POST" });
    const payload = await response.json() as { checkoutUrl?: string; fields?: Record<string, string | number>; error?: string };
    if (!response.ok || !payload.checkoutUrl || !payload.fields) return alert(payload.error || "Không tạo được thanh toán.");
    const form = document.createElement("form"); form.method = "POST"; form.action = payload.checkoutUrl;
    Object.entries(payload.fields).forEach(([name, value]) => { const input = document.createElement("input"); input.type = "hidden"; input.name = name; input.value = String(value); form.appendChild(input); });
    document.body.appendChild(form); form.submit();
  }

  const closePreview = useCallback(() => {
    setPreview(null);
    setSlideshowActive(false);
    setSlideshowPaused(false);
  }, []);

  function startSlideshow() {
    const firstPhoto = visiblePhotos[0] || previewPhotos[0] || null;
    if (!firstPhoto) return;
    setPreview(firstPhoto);
    setSlideshowActive(true);
    setSlideshowPaused(false);
  }

  const showPreviousPhoto = useCallback(() => {
    if (!preview || previewPhotos.length === 0) return;
    const currentIndex = previewIndex >= 0 ? previewIndex : 0;
    setPreview(previewPhotos[(currentIndex - 1 + previewPhotos.length) % previewPhotos.length]);
  }, [preview, previewIndex, previewPhotos]);

  const showNextPhoto = useCallback(() => {
    if (!preview || previewPhotos.length === 0) return;
    const currentIndex = previewIndex >= 0 ? previewIndex : 0;
    setPreview(previewPhotos[(currentIndex + 1) % previewPhotos.length]);
  }, [preview, previewIndex, previewPhotos]);

  useEffect(() => {
    if (!preview) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") showPreviousPhoto();
      if (event.key === "ArrowRight") showNextPhoto();
      if (event.key === "Escape") closePreview();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview, preview, showNextPhoto, showPreviousPhoto]);

  useEffect(() => {
    if (!slideshowActive || slideshowPaused || !preview || previewPhotos.length <= 1) return;

    const timer = window.setInterval(() => {
      setPreview((currentPhoto) => {
        if (!currentPhoto) return currentPhoto;
        const currentIndex = previewPhotos.findIndex((photo) => photo.id === currentPhoto.id);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % previewPhotos.length : 0;
        return previewPhotos[nextIndex];
      });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [preview, previewPhotos, slideshowActive, slideshowPaused]);

  useEffect(() => {
    if (gallery.payment_status !== "pending") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/customer-galleries/${gallery.customer_name_slug}/payment`, { cache: "no-store" });
      const status = await response.json() as { payment_status?: string };
      if (status.payment_status === "paid") window.location.reload();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [gallery.customer_name_slug, gallery.payment_status]);

  useEffect(() => {
    if (autoSyncStarted.current) return;
    autoSyncStarted.current = true;

    void syncPhotos({ silent: true });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void syncPhotos({ silent: true });
    }, 120000);

    return () => window.clearInterval(timer);
  }, []);

  async function patchPhoto(photoId: string, body: { selected?: boolean; editNote?: string }) {
    await fetch(`/api/customer-galleries/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function toggleSelected(photo: GalleryPhoto) {
    const nextSelected = !photo.selected;
    setPhotos((current) => current.map((item) => (item.id === photo.id ? { ...item, selected: nextSelected } : item)));
    void patchPhoto(photo.id, { selected: nextSelected });
  }

  function updateNote(photo: GalleryPhoto, editNote: string) {
    setPhotos((current) => current.map((item) => (item.id === photo.id ? { ...item, edit_note: editNote } : item)));
    window.clearTimeout(saveTimers.current[photo.id]);
    saveTimers.current[photo.id] = window.setTimeout(() => {
      void patchPhoto(photo.id, { editNote });
    }, 450);
  }

  async function syncPhotos(options?: { silent?: boolean }) {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setSyncing(true);
    try {
      const response = await fetch(`/api/customer-galleries/${gallery.customer_name_slug}/sync`, { method: "POST" });
      const payload = await response.json().catch(() => ({})) as { rawCount?: number; editedCount?: number; newRawCount?: number; newEditedCount?: number; error?: string };
      if (response.ok) {
        const hasNewPhotos = (payload.newRawCount || 0) > 0 || (payload.newEditedCount || 0) > 0;
        if (hasNewPhotos || !options?.silent) {
          window.location.reload();
        }
        return;
      }

      if (!options?.silent) {
        alert(payload.error || "Không đồng bộ được ảnh mới.");
      }
    } finally {
      syncInFlight.current = false;
      setSyncing(false);
    }
  }

  const downloadAction =
    tab === "all"
      ? {
          href: `/api/customer-galleries/${gallery.customer_name_slug}/download?kind=raw`,
          enabled: gallery.raw_download_enabled,
          label: "Tải xuống",
          disabledLabel: "Tải xuống đang khóa",
        }
      : tab === "edited"
        ? {
            href: `/api/customer-galleries/${gallery.customer_name_slug}/download?kind=edited`,
            enabled: gallery.edited_download_enabled,
            label: "Tải file đã chỉnh",
            disabledLabel: "File đã chỉnh đang khóa",
          }
        : null;

  return (
    <div className="min-h-screen bg-[#07080a] text-white">
      <main className="mx-auto max-w-[1680px] px-4 pb-20 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-b-lg border-x border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/10" />
          {cover ? (
            <Image src={cover} alt={gallery.customer_name} fill priority sizes="100vw" className="object-cover opacity-75" unoptimized />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(216,183,102,0.26),transparent_32%),#101216]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-transparent to-black/30" />
          <div className="relative min-h-[500px] px-5 py-12 sm:px-10 lg:px-12">
            <div className="max-w-2xl pt-8">
              <p className="font-heading text-2xl italic text-[#d8b766]">Album ảnh</p>
              <h1 className="mt-3 font-heading text-4xl font-extrabold leading-tight text-white md:text-6xl">{gallery.customer_name}</h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-200">
                <span>{shootDate}</span>
                <span className="size-1 rounded-full bg-[#d8b766]" />
                <span>Album chọn ảnh trực tuyến</span>
              </div>
              <p className="mt-6 max-w-md text-sm leading-7 text-zinc-300">
                Cảm ơn anh/chị đã tin tưởng TLORA Studio. Ghi chú chỉnh sửa được tự động lưu khi nhập trong phần xem ảnh.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={startSlideshow} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d8b766] px-5 text-sm font-semibold text-black shadow-lg shadow-[#d8b766]/20">
                  <Play size={17} fill="currentColor" />
                  Xem slideshow
                </button>
                <button className="inline-flex min-h-12 items-center gap-3 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur">
                  <Share2 size={17} />
                  Chia sẻ album
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={ImageIcon} value={photos.length} label="Ảnh trong album" tone="violet" />
              <StatCard icon={Check} value={selectedPhotos.length} label="Ảnh đã chọn" tone="rose" />
              <StatCard icon={Edit3} value={notedPhotos.length} label="Ảnh cần chỉnh sửa" tone="gold" />
              <StatCard icon={UploadCloud} value={gallery.raw_download_enabled ? "Sẵn sàng" : "Đang khóa"} label="Tải file gốc" tone="green" />
            </div>
          </div>
        </section>

        {remaining > 0 && !gallery.edited_download_enabled && <section className="mt-6 flex flex-col gap-4 rounded-lg border border-[#d8b766]/35 bg-[#d8b766]/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#f3d88e]">Thanh toán còn lại</p><p className="mt-1 text-sm text-zinc-300">Tổng chi phí {new Intl.NumberFormat("vi-VN").format(gallery.total_cost_vnd)}đ · Đã cọc {new Intl.NumberFormat("vi-VN").format(gallery.deposit_paid_vnd)}đ</p><p className="mt-2 text-2xl font-extrabold text-white">Còn lại {new Intl.NumberFormat("vi-VN").format(remaining)}đ</p></div><button onClick={payRemaining} className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#d8b766] px-5 text-sm font-bold text-black">Thanh toán với SePay</button></section>}
        {gallery.payment_status === "pending" && <p className="mt-4 rounded-md border border-sky-300/20 bg-sky-300/10 p-3 text-center text-sm text-sky-100">Đang chờ SePay xác nhận. Trang sẽ tự cập nhật trong vài phút để mở khóa tải xuống.</p>}
        <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((item) => {
                const Icon = item.icon;
                const count = item.value === "all" ? photos.length : item.value === "selected" ? selectedPhotos.length : item.value === "noted" ? notedPhotos.length : editedPhotos.length;
                return (
                  <button
                    key={item.value}
                    onClick={() => setTab(item.value)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition ${
                      tab === item.value ? "bg-[#d8b766]/20 text-[#f3d88e]" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {downloadAction && <DownloadButton {...downloadAction} />}
              <label className="flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 text-sm text-zinc-400">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm" className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500 sm:w-44" />
              </label>
              <button onClick={() => syncPhotos()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 text-sm font-semibold text-zinc-200">
                {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Mới nhất
              </button>
            </div>
          </div>
        </section>

        <PhotoGrid
          photos={visiblePhotos}
          selectedIds={new Set(selectedPhotos.map((photo) => photo.id))}
          canDownloadRaw={gallery.raw_download_enabled}
          canDownloadEdited={gallery.edited_download_enabled}
          onPreview={setPreview}
          onToggle={toggleSelected}
        />
      </main>

      {preview && (
        <PreviewModal
          photo={preview}
          photos={previewPhotos}
          index={previewIndex}
          slideshowActive={slideshowActive}
          slideshowPaused={slideshowPaused}
          onToggleSlideshowPause={() => setSlideshowPaused((paused) => !paused)}
          onClose={closePreview}
          onPrevious={showPreviousPhoto}
          onNext={showNextPhoto}
          onToggle={toggleSelected}
          onNote={updateNote}
          setPreview={setPreview}
          canDownloadRaw={gallery.raw_download_enabled}
          canDownloadEdited={gallery.edited_download_enabled}
        />
      )}
    </div>
  );
}

function DownloadButton({ href, enabled, label, disabledLabel }: { href: string; enabled: boolean; label: string; disabledLabel: string }) {
  if (!enabled) {
    return (
      <button disabled className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-500">
        <Download size={17} />
        {disabledLabel}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#d8b766] px-4 text-sm font-semibold text-black">
      <Download size={17} />
      {label}
    </a>
  );
}

function photoDownloadHref(photoId: string) {
  return `/api/customer-galleries/photos/${photoId}/download`;
}

function StatCard({ icon: Icon, value, label, tone }: { icon: typeof ImageIcon; value: number | string; label: string; tone: "violet" | "rose" | "gold" | "green" }) {
  const tones = {
    violet: "bg-violet-500/15 text-violet-300",
    rose: "bg-rose-500/15 text-rose-300",
    gold: "bg-[#d8b766]/15 text-[#f3d88e]",
    green: "bg-emerald-500/15 text-emerald-300",
  };
  return (
    <div className="rounded-lg border border-white/15 bg-black/30 p-5 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-center gap-4">
        <span className={`grid size-12 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={21} />
        </span>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm text-zinc-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function PhotoGrid({
  photos,
  selectedIds,
  canDownloadRaw,
  canDownloadEdited,
  onPreview,
  onToggle,
}: {
  photos: GalleryPhoto[];
  selectedIds: Set<string>;
  canDownloadRaw: boolean;
  canDownloadEdited: boolean;
  onPreview: (photo: GalleryPhoto) => void;
  onToggle: (photo: GalleryPhoto) => void;
}) {
  if (photos.length === 0) {
    return <EmptyState text="Chưa có ảnh phù hợp với bộ lọc hiện tại." />;
  }

  return (
    <div className="mt-3 columns-1 gap-3 sm:columns-2 lg:columns-3 2xl:columns-4">
      {photos.map((photo, index) => {
        const selected = selectedIds.has(photo.id);
        const canDownload = photo.kind === "raw" ? canDownloadRaw : canDownloadEdited;
        const downloadHref = photoDownloadHref(photo.id);
        return (
          <article key={photo.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <button onClick={() => onPreview(photo)} className={`relative block w-full bg-zinc-900 ${index % 5 === 1 ? "aspect-[4/5]" : index % 5 === 3 ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
              {photo.thumbnail_url ? (
                <Image src={photo.thumbnail_url} alt={photo.file_name} fill sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
              ) : (
                <EmptyImage />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20 opacity-80" />
            </button>
            <button
              onClick={() => onToggle(photo)}
              className={`absolute left-3 top-3 grid size-8 place-items-center rounded-md border text-sm shadow-lg ${
                selected ? "border-[#f3d88e] bg-[#d8b766] text-black" : "border-white/50 bg-black/35 text-white backdrop-blur"
              }`}
              aria-label={selected ? "Bỏ chọn ảnh" : "Chọn ảnh"}
            >
              {selected && <Check size={17} />}
            </button>
            {canDownload ? (
              <a
                href={downloadHref}
                download={photo.file_name}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-[#d8b766] hover:text-black"
                aria-label="Tải ảnh"
                title="Tải ảnh"
                onClick={(event) => event.stopPropagation()}
              >
                <Download size={17} />
              </a>
            ) : (
              <button
                disabled
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/25 text-zinc-500 backdrop-blur"
                aria-label="Tải ảnh đang khóa"
                title="Tải ảnh đang khóa"
              >
                <Download size={17} />
              </button>
            )}
            {photo.edit_note && (
              <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-[#f3d88e] backdrop-blur">
                Có ghi chú
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}

function PreviewModal({
  photo,
  photos,
  index,
  slideshowActive,
  slideshowPaused,
  onToggleSlideshowPause,
  onClose,
  onPrevious,
  onNext,
  onToggle,
  onNote,
  setPreview,
  canDownloadRaw,
  canDownloadEdited,
}: {
  photo: GalleryPhoto;
  photos: GalleryPhoto[];
  index: number;
  slideshowActive: boolean;
  slideshowPaused: boolean;
  onToggleSlideshowPause: () => void;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: (photo: GalleryPhoto) => void;
  onNote: (photo: GalleryPhoto, note: string) => void;
  setPreview: (photo: GalleryPhoto | null) => void;
  canDownloadRaw: boolean;
  canDownloadEdited: boolean;
}) {
  const canDownload = photo.kind === "raw" ? canDownloadRaw : canDownloadEdited;
  const downloadHref = photoDownloadHref(photo.id);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-3" role="dialog" aria-modal="true">
      <div className="relative grid h-[94vh] w-full max-w-7xl overflow-hidden rounded-lg border border-white/10 bg-[#101115] shadow-2xl lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[55vh] bg-black">
          {photo.preview_url || photo.thumbnail_url ? (
            <Image src={photo.preview_url || photo.thumbnail_url || ""} alt={photo.file_name} fill sizes="(min-width: 1024px) calc(100vw - 420px), 100vw" className="object-contain" unoptimized />
          ) : (
            <div className="grid h-full place-items-center text-zinc-400">Không có preview</div>
          )}
        </div>
        <aside className="border-t border-white/10 bg-[#14151a] p-5 text-white lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8b766]">{photo.kind === "edited" ? "File đã chỉnh" : "File gốc"}</p>
          <h2 className="mt-3 break-words font-heading text-xl font-bold">{photo.file_name}</h2>
          {photo.kind === "raw" ? (
            <div className="mt-6 space-y-4">
              <button
                onClick={() => {
                  onToggle(photo);
                  setPreview({ ...photo, selected: !photo.selected });
                }}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
                  photo.selected ? "bg-emerald-500 text-black" : "bg-[#d8b766] text-black"
                }`}
              >
                {photo.selected ? <Check size={18} /> : <span className="size-4 rounded border border-current" />}
                {photo.selected ? "Đã chọn ảnh này" : "Chọn ảnh này"}
              </button>
              <label className="block text-sm font-semibold text-zinc-200" htmlFor={`modal-note-${photo.id}`}>
                Mô tả cần chỉnh sửa
              </label>
              <textarea
                id={`modal-note-${photo.id}`}
                value={photo.edit_note || ""}
                onChange={(event) => {
                  const editNote = event.target.value;
                  onNote(photo, editNote);
                  setPreview({ ...photo, edit_note: editNote });
                }}
                placeholder="Ví dụ: làm da nhẹ, giữ màu tóc, crop ngang..."
                className="min-h-40 w-full resize-none rounded-md border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#d8b766]"
              />
              <p className="text-xs font-medium text-emerald-300">Ghi chú tự động lưu khi khách nhập.</p>
              {canDownload && (
                <a href={downloadHref} download={photo.file_name} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 text-sm font-semibold text-white">
                  <Download size={16} /> Tải ảnh
                </a>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-sm leading-6 text-zinc-400">Ảnh đã chỉnh sửa từ thư mục file hoàn thiện.</p>
              {canDownload && (
                <a href={downloadHref} download={photo.file_name} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-semibold text-black">
                  <Download size={16} /> Tải ảnh
                </a>
              )}
            </div>
          )}
        </aside>
        {slideshowActive && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 p-1.5 text-white shadow-lg backdrop-blur">
            <button
              onClick={onToggleSlideshowPause}
              className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:bg-white/10"
              aria-label={slideshowPaused ? "Tiếp tục slideshow" : "Tạm dừng slideshow"}
            >
              {slideshowPaused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
              {slideshowPaused ? "Tiếp tục" : "Tạm dừng"}
            </button>
            <button
              onClick={onClose}
              className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-semibold transition hover:bg-[#d8b766] hover:text-black"
              aria-label="Thoát slideshow"
            >
              <X size={17} />
              Thoát
            </button>
          </div>
        )}
        <button onClick={onClose} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur" aria-label="Đóng">
          <X size={20} />
        </button>
        {photos.length > 1 && (
          <>
            <button onClick={onPrevious} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur" aria-label="Ảnh trước">
              <ChevronLeft size={25} />
            </button>
            <button onClick={onNext} className="absolute right-3 top-[38%] grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur lg:right-[380px] lg:top-1/2" aria-label="Ảnh tiếp theo">
              <ChevronRight size={25} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-sm font-semibold text-white">
              {Math.max(index + 1, 1)} / {photos.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 grid min-h-64 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-zinc-400">
      <div>
        <ImageOff className="mx-auto" size={38} />
        <p className="mt-3 text-sm font-semibold">{text}</p>
      </div>
    </div>
  );
}

function EmptyImage() {
  return (
    <div className="grid h-full place-items-center text-zinc-500">
      <ImageOff size={32} />
    </div>
  );
}
