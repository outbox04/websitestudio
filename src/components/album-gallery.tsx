"use client";

import Image from "next/image";
import { Check, Expand, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { albumPhotos } from "@/lib/site-data";
import { StateBox } from "@/components/ui";

export function AlbumGallery() {
  const [selected, setSelected] = useState<Record<string, boolean>>({ drv_002: true });
  const [notes, setNotes] = useState<Record<string, string>>({ drv_002: "Làm da tự nhiên, giữ nốt ruồi nhỏ." });
  const [preview, setPreview] = useState<(typeof albumPhotos)[number] | null>(null);
  const [saving, setSaving] = useState(false);
  const count = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  function saveSelection() {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 700);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <StateBox title="Album cá nhân" description="Đồng bộ từ Google Drive Folder của từng khách." />
        <StateBox title={`${count} ảnh đã chọn`} description="Ghi chú nằm ngay dưới từng ảnh để tránh nhầm yêu cầu." tone="success" />
        <StateBox title="Trạng thái xử lý" description="Chờ chọn, Đã chọn, Đang chỉnh, Đã hoàn thành." />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {albumPhotos.map((photo) => {
          const isSelected = Boolean(selected[photo.id]);
          return (
            <article key={photo.id} className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
              <div className="relative aspect-[4/5] bg-zinc-100">
                <Image src={photo.src} alt={photo.name} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                <button
                  onClick={() => setPreview(photo)}
                  className="absolute right-3 top-3 grid size-10 place-items-center rounded-md bg-white/95 text-zinc-900 shadow"
                  aria-label="Xem ảnh lớn"
                >
                  <Expand size={18} />
                </button>
                <button
                  onClick={() => setSelected((current) => ({ ...current, [photo.id]: !current[photo.id] }))}
                  className={`absolute left-3 top-3 flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold shadow ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-white/95 text-zinc-900"
                  }`}
                >
                  {isSelected ? <Check size={18} /> : <span className="size-4 rounded border border-zinc-400" />}
                  {isSelected ? "Đã chọn" : "Chọn ảnh"}
                </button>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{photo.name}</h3>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{photo.status}</span>
                </div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor={`note-${photo.id}`}>
                  Ghi chú chỉnh sửa
                </label>
                <textarea
                  id={`note-${photo.id}`}
                  value={notes[photo.id] || ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [photo.id]: event.target.value }))}
                  placeholder="Ví dụ: chỉnh da nhẹ, giữ màu son, crop ngang..."
                  className="min-h-24 w-full resize-none rounded-md border border-zinc-200 bg-stone-50 p-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                />
              </div>
            </article>
          );
        })}
      </div>
      <button
        onClick={saveSelection}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
      >
        {saving && <Loader2 className="animate-spin" size={16} />}
        Lưu lựa chọn ảnh
      </button>
      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/80 p-4" role="dialog" aria-modal="true">
          <div className="relative h-[86vh] w-full max-w-5xl overflow-hidden rounded-md bg-white">
            <Image src={preview.src} alt={preview.name} fill sizes="90vw" className="object-contain" />
            <button onClick={() => setPreview(null)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-md bg-white text-zinc-900 shadow" aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
