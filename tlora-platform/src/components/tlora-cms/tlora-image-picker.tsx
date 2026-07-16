"use client";

import { Check, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { optimizeImageForWeb, type OptimizedWebImage } from "@/lib/client/image-optimizer";
import type { TloraCmsMediaAsset } from "@/types/scope";

export type ImageTarget = {
  sectionKey: string;
  field: string;
  currentUrl: string;
};

export function TloraImagePicker({
  target,
  assets,
  onClose,
  onApply,
  onUploaded,
}: {
  target: ImageTarget;
  assets: TloraCmsMediaAsset[];
  onClose: () => void;
  onApply: (url: string) => void;
  onUploaded: (asset: TloraCmsMediaAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedUrl, setSelectedUrl] = useState(target.currentUrl);
  const [optimized, setOptimized] = useState<OptimizedWebImage | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => () => {
    if (optimized?.previewUrl) URL.revokeObjectURL(optimized.previewUrl);
  }, [optimized]);

  async function prepare(file: File) {
    setBusy("optimize");
    setMessage("");
    try {
      const next = await optimizeImageForWeb(file);
      setOptimized((current) => {
        if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return next;
      });
      setSelectedUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tối ưu ảnh.");
    } finally {
      setBusy("");
    }
  }

  async function confirm() {
    if (optimized) {
      setBusy("upload");
      setMessage("");
      const form = new FormData();
      form.set("file", optimized.file);
      form.set("altText", optimized.file.name.replace(/\.[^.]+$/, ""));
      form.set("width", String(optimized.width));
      form.set("height", String(optimized.height));
      try {
        const response = await fetch("/api/admin/tlora/media", { method: "POST", body: form });
        const result = await response.json() as { media?: TloraCmsMediaAsset; error?: string };
        if (!response.ok || !result.media?.publicUrl) throw new Error(result.error || "Không thể lưu ảnh vào thư viện.");
        onUploaded(result.media);
        onApply(result.media.publicUrl);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Không thể tải ảnh.");
        setBusy("");
      }
      return;
    }
    if (selectedUrl) onApply(selectedUrl);
  }

  const previewUrl = optimized?.previewUrl || selectedUrl;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#2a2722] bg-[#101115] text-[#f8f5ee] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-extrabold">Thay thế ảnh</h2>
            <p className="mt-1 text-xs text-[#8c8174]">Chọn ảnh thư viện hoặc tải ảnh mới đã được tối ưu cho website.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid size-10 place-items-center rounded-md border border-white/10"><X size={18} /></button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">Thư viện ảnh</p>
              <><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepare(file); event.currentTarget.value = ""; }} /><button type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-50">{busy === "optimize" ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Tải ảnh mới</button></>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {assets.filter((asset) => asset.publicUrl).map((asset) => (
                <button key={asset.id} type="button" onClick={() => { setSelectedUrl(asset.publicUrl || ""); setOptimized(null); }} className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-[#14110f] bg-cover bg-center ${selectedUrl === asset.publicUrl ? "border-[#d8b766]" : "border-transparent"}`} style={{ backgroundImage: `url(${asset.publicUrl})` }}>
                  {selectedUrl === asset.publicUrl && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#d8b766] text-[#07080a]"><Check size={15} /></span>}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1.5 text-left text-[11px]">{asset.fileName}</span>
                </button>
              ))}
              {!assets.length && <div className="col-span-full rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-[#8c8174]"><ImagePlus className="mx-auto mb-3" />Thư viện chưa có ảnh.</div>}
            </div>
          </div>

          <aside className="border-t border-white/10 bg-[#07080a] p-5 lg:border-l lg:border-t-0">
            <p className="text-sm font-bold">Xem trước</p>
            <div className="mt-3 aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#1c1813] bg-contain bg-center bg-no-repeat" style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined} />
            {optimized && (
              <div className="mt-3 rounded-md bg-white/[.04] p-3 text-xs leading-5 text-[#cbc0b0]">
                <p>{optimized.width} × {optimized.height}px · WebP</p>
                <p>{(optimized.originalBytes / 1024).toFixed(0)} KB → {(optimized.file.size / 1024).toFixed(0)} KB</p>
              </div>
            )}
            {message && <p className="mt-3 text-xs font-semibold text-red-300">{message}</p>}
            <button type="button" onClick={confirm} disabled={!previewUrl || Boolean(busy)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-40">
              {busy === "upload" ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />}
              {optimized ? "Xác nhận & lưu vào thư viện" : "Xác nhận dùng ảnh"}
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
