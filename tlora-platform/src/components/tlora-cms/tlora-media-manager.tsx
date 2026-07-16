"use client";

import { Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { TloraCmsMediaAsset } from "@/types/scope";

export function TloraMediaManager({ initialMedia }: { initialMedia: TloraCmsMediaAsset[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy("upload");
    const form = new FormData();
    form.set("file", file);
    form.set("altText", file.name.replace(/\.[^.]+$/, ""));
    try {
      const response = await fetch("/api/admin/tlora/media", { method: "POST", body: form });
      const result = await response.json() as { media?: TloraCmsMediaAsset; error?: string };
      if (!response.ok || !result.media) throw new Error(result.error || "Không thể upload ảnh.");
      setMedia((current) => [result.media!, ...current]);
      setMessage("Đã thêm ảnh vào Media Library.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể upload ảnh.");
    } finally {
      setBusy("");
    }
  }

  async function remove(asset: TloraCmsMediaAsset) {
    if (!window.confirm(`Xóa ${asset.fileName}?`)) return;
    setBusy(asset.id);
    const response = await fetch(`/api/admin/tlora/media?id=${asset.id}`, { method: "DELETE" });
    if (response.ok) {
      setMedia((current) => current.filter((item) => item.id !== asset.id));
      setMessage("Đã xóa ảnh.");
    } else setMessage("Không thể xóa ảnh.");
    setBusy("");
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">TLORA assets</p><h1 className="mt-2 text-3xl font-extrabold">Media Library</h1><p className="mt-2 text-sm text-zinc-600">JPEG, PNG hoặc WebP; tối đa 8MB. Token Storage không xuất hiện ở client.</p></div><><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} /><button type="button" onClick={() => input.current?.click()} disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-50">{busy === "upload" ? <Loader2 className="animate-spin" size={17} /> : <ImagePlus size={17} />} Tải ảnh lên</button></></header>
      {message && <p className="mt-5 rounded-md bg-white p-3 text-sm font-semibold text-zinc-700">{message}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {media.map((asset) => <article key={asset.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white"><div className="aspect-[4/3] bg-zinc-100" style={asset.publicUrl ? { backgroundImage: `url(${asset.publicUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} /><div className="p-4"><p className="truncate text-sm font-bold">{asset.fileName}</p><p className="mt-1 text-xs text-zinc-500">{(asset.sizeBytes / 1024).toFixed(0)} KB · {asset.mimeType}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => asset.publicUrl && navigator.clipboard.writeText(asset.publicUrl)} disabled={!asset.publicUrl} className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-md border border-zinc-300 text-xs font-bold"><Copy size={14} /> Copy URL</button><button type="button" onClick={() => remove(asset)} disabled={busy === asset.id} aria-label="Xóa ảnh" className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700"><Trash2 size={15} /></button></div></div></article>)}
      </div>
    </main>
  );
}

