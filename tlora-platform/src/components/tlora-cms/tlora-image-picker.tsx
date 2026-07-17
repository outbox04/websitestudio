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
  onApplyMany,
  onUploaded,
  multiple = false,
}: {
  target: ImageTarget;
  assets: TloraCmsMediaAsset[];
  onClose: () => void;
  onApply: (url: string) => void;
  onApplyMany?: (urls: string[]) => void;
  onUploaded: (asset: TloraCmsMediaAsset) => void;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedUrl, setSelectedUrl] = useState(target.currentUrl);
  const [optimized, setOptimized] = useState<OptimizedWebImage[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");

  useEffect(() => () => {
    optimized.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, [optimized]);

  async function prepare(files: File[]) {
    setBusy("optimize");
    setMessage("");
    setProgress("");
    try {
      const selectedFiles = multiple ? files : files.slice(0, 1);
      const next: OptimizedWebImage[] = [];
      for (let index = 0; index < selectedFiles.length; index += 1) {
        setProgress(`Đang tối ưu ${index + 1}/${selectedFiles.length}`);
        next.push(await optimizeImageForWeb(selectedFiles[index]));
      }
      setOptimized((current) => {
        current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return next;
      });
      setSelectedUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tối ưu ảnh.");
    } finally {
      setBusy("");
      setProgress("");
    }
  }

  async function confirm() {
    if (optimized.length) {
      setBusy("upload");
      setMessage("");
      try {
        const urls: string[] = [];
        for (let index = 0; index < optimized.length; index += 1) {
          const image = optimized[index];
          setProgress(`Đang tải lên ${index + 1}/${optimized.length}`);
          const form = new FormData();
          form.set("file", image.file);
          form.set("altText", image.file.name.replace(/\.[^.]+$/, ""));
          form.set("width", String(image.width));
          form.set("height", String(image.height));
          const response = await fetch("/api/admin/tlora/media", { method: "POST", body: form });
          const result = await response.json() as { media?: TloraCmsMediaAsset; error?: string };
          if (!response.ok || !result.media?.publicUrl) throw new Error(result.error || `Không thể tải ảnh ${index + 1}.`);
          onUploaded(result.media);
          urls.push(result.media.publicUrl);
        }
        if (multiple && onApplyMany) onApplyMany(urls);
        else if (urls[0]) onApply(urls[0]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Không thể tải ảnh.");
        setBusy("");
        setProgress("");
      }
      return;
    }
    if (selectedUrl) onApply(selectedUrl);
  }

  const previewUrl = optimized[0]?.previewUrl || selectedUrl;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#2a2722] bg-[#101115] text-[#f8f5ee] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-extrabold">{multiple ? "Thêm nhiều ảnh" : "Thay thế ảnh"}</h2>
            <p className="mt-1 text-xs text-[#8c8174]">{multiple ? "Chọn nhiều tệp cùng lúc; tất cả ảnh sẽ được tối ưu trước khi tải lên." : "Chọn ảnh thư viện hoặc tải ảnh mới đã được tối ưu cho website."}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid size-10 place-items-center rounded-md border border-white/10"><X size={18} /></button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">Thư viện ảnh</p>
              <><input ref={inputRef} type="file" multiple={multiple} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const files = Array.from(event.target.files || []); if (files.length) void prepare(files); event.currentTarget.value = ""; }} /><button type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-50">{busy === "optimize" ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} {multiple ? "Tải nhiều ảnh" : "Tải ảnh mới"}</button></>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {assets.filter((asset) => asset.publicUrl).map((asset) => (
                <button key={asset.id} type="button" onClick={() => { setSelectedUrl(asset.publicUrl || ""); setOptimized((current) => { current.forEach((image) => URL.revokeObjectURL(image.previewUrl)); return []; }); }} className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-[#14110f] bg-cover bg-center ${selectedUrl === asset.publicUrl ? "border-[#d8b766]" : "border-transparent"}`} style={{ backgroundImage: `url(${asset.publicUrl})` }}>
                  {selectedUrl === asset.publicUrl && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#d8b766] text-[#07080a]"><Check size={15} /></span>}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1.5 text-left text-[11px]">{asset.fileName}</span>
                </button>
              ))}
              {!assets.length && <div className="col-span-full rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-[#8c8174]"><ImagePlus className="mx-auto mb-3" />Thư viện chưa có ảnh.</div>}
            </div>
          </div>

          <aside className="border-t border-white/10 bg-[#07080a] p-5 lg:border-l lg:border-t-0">
            <p className="text-sm font-bold">Xem trước</p>
            {optimized.length > 1 ? <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">{optimized.map((image, index) => <div key={`${image.file.name}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-md border border-white/10 bg-cover bg-center" style={{ backgroundImage: `url(${image.previewUrl})` }}><span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">{index + 1}</span></div>)}</div> : <div className="mt-3 aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#1c1813] bg-contain bg-center bg-no-repeat" style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined} />}
            {optimized.length === 1 && (
              <div className="mt-3 rounded-md bg-white/[.04] p-3 text-xs leading-5 text-[#cbc0b0]">
                <p>{optimized[0].width} × {optimized[0].height}px · WebP</p>
                <p>{(optimized[0].originalBytes / 1024).toFixed(0)} KB → {(optimized[0].file.size / 1024).toFixed(0)} KB</p>
              </div>
            )}
            {optimized.length > 1 && <p className="mt-3 text-xs font-semibold text-[#cbc0b0]">Đã sẵn sàng {optimized.length} ảnh WebP.</p>}
            {progress && <p className="mt-3 text-xs font-semibold text-[#d8b766]">{progress}</p>}
            {message && <p className="mt-3 text-xs font-semibold text-red-300">{message}</p>}
            <button type="button" onClick={confirm} disabled={!previewUrl || Boolean(busy)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] px-4 text-sm font-bold text-[#07080a] disabled:opacity-40">
              {busy === "upload" ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />}
              {optimized.length ? `Xác nhận & tải ${optimized.length} ảnh` : "Xác nhận dùng ảnh"}
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
