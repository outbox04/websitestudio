"use client";

import { Check, Loader2, Move, RotateCcw, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { TloraCmsMediaAsset } from "@/types/scope";

const outputWidth = 1200;
const outputHeight = 675;

export function TloraOgImageCropper({
  imageUrl,
  pageKey,
  pageTitle,
  onApplied,
  onUploaded,
}: {
  imageUrl: string;
  pageKey: string;
  pageTitle: string;
  onApplied: (url: string) => void;
  onUploaded: (asset: TloraCmsMediaAsset) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function beginDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageUrl || !frameRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, position };
    const frame = frameRef.current.getBoundingClientRect();

    const move = (moveEvent: PointerEvent) => {
      setPosition({
        x: Math.min(100, Math.max(0, start.position.x - ((moveEvent.clientX - start.x) / frame.width) * 100 / zoom)),
        y: Math.min(100, Math.max(0, start.position.y - ((moveEvent.clientY - start.y) / frame.height) * 100 / zoom)),
      });
    };
    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  }

  async function exportCrop() {
    if (!imageUrl) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Không thể tải ảnh nguồn để tạo khung OG.");
      const source = await createImageBitmap(await response.blob());
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

      const coverScale = Math.max(outputWidth / source.width, outputHeight / source.height) * zoom;
      const cropWidth = Math.min(source.width, outputWidth / coverScale);
      const cropHeight = Math.min(source.height, outputHeight / coverScale);
      const sourceX = Math.max(0, (source.width - cropWidth) * (position.x / 100));
      const sourceY = Math.max(0, (source.height - cropHeight) * (position.y / 100));
      context.drawImage(source, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
      source.close();

      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Không thể xuất ảnh OG.")), "image/webp", .9));
      const file = new File([blob], `og-${pageKey}.webp`, { type: "image/webp" });
      const form = new FormData();
      form.set("file", file);
      form.set("altText", pageTitle || `OG ${pageKey}`);
      form.set("width", String(outputWidth));
      form.set("height", String(outputHeight));
      const upload = await fetch("/api/admin/tlora/media", { method: "POST", body: form });
      const result = await upload.json() as { media?: TloraCmsMediaAsset; error?: string };
      if (!upload.ok || !result.media?.publicUrl) throw new Error(result.error || "Không thể lưu ảnh OG.");
      onUploaded(result.media);
      onApplied(result.media.publicUrl);
      setMessage("Đã tạo ảnh OG 16:9 và lưu vào thư viện.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo ảnh OG.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div
        ref={frameRef}
        onPointerDown={beginDrag}
        className="relative aspect-video touch-none overflow-hidden rounded-lg border border-white/10 bg-[#1c1813]"
        style={{ cursor: imageUrl ? "move" : "default" }}
        title={imageUrl ? "Kéo để căn vị trí ảnh" : undefined}
      >
        {imageUrl && <Image src={imageUrl} alt="Bản xem trước ảnh OG" fill unoptimized sizes="288px" className="pointer-events-none select-none object-cover" style={{ objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})` }} />}
        {!imageUrl && <p className="absolute inset-0 grid place-items-center px-6 text-center text-xs leading-5 text-[#8c8174]">Chọn ảnh để bắt đầu căn khung 16:9</p>}
        {imageUrl && <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 text-[10px] font-bold text-white"><Move size={12} /> Kéo để căn ảnh</span>}
      </div>
      <label className="mt-3 flex items-center gap-3 text-xs font-bold text-[#cbc0b0]"><ZoomIn size={15} /><span className="shrink-0">Thu phóng</span><input type="range" min="1" max="3" step="0.05" value={zoom} disabled={!imageUrl} onChange={(event) => setZoom(Number(event.target.value))} className="min-w-0 flex-1 accent-[#d8b766]" /><span className="w-9 text-right">{zoom.toFixed(1)}×</span></label>
      <div className="mt-3 grid grid-cols-[40px_1fr] gap-2">
        <button type="button" onClick={() => { setPosition({ x: 50, y: 50 }); setZoom(1); }} disabled={!imageUrl || busy} aria-label="Đặt lại khung ảnh" className="grid size-10 place-items-center rounded-md border border-white/15 text-[#cbc0b0] disabled:opacity-40"><RotateCcw size={16} /></button>
        <button type="button" onClick={exportCrop} disabled={!imageUrl || busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#d8b766] px-3 text-xs font-bold text-[#07080a] disabled:opacity-40">{busy ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Lưu khung ảnh 16:9</button>
      </div>
      {message && <p className={`mt-2 text-xs leading-5 ${message.startsWith("Đã") ? "text-emerald-300" : "text-red-300"}`}>{message}</p>}
    </div>
  );
}
