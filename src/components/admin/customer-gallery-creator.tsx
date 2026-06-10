"use client";

import { Check, Copy, Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

type CreatedGallery = {
  customerUrl: string;
  reused?: boolean;
  gallery: {
    customer_name: string;
    raw_drive_folder_url: string;
    edited_drive_folder_url: string;
    customer_name_slug: string;
    raw_download_enabled: boolean;
    edited_download_enabled: boolean;
  };
};

export function CustomerGalleryCreator() {
  const [name, setName] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [result, setResult] = useState<CreatedGallery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [notice, setNotice] = useState("");

  async function createGallery() {
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const response = await fetch("/api/admin/customer-galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shootDate }),
      });
      const data = (await response.json()) as CreatedGallery & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Không tạo được thư mục");
      }

      setResult(data);
      window.dispatchEvent(new Event("customer-gallery:changed"));
      if (data.reused) {
        setNotice("Thư mục này đã tồn tại trong database, hệ thống đang hiển thị lại các đường link đã lưu.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tạo được thư mục");
    } finally {
      setLoading(false);
    }
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1200);
  }

  async function syncPhotos() {
    if (!result) return;
    await fetch(`/api/customer-galleries/${result.gallery.customer_name_slug}/sync`, { method: "POST" });
  }

  async function toggleRawDownload() {
    if (!result) return;
    const nextValue = !result.gallery.raw_download_enabled;
    const response = await fetch(`/api/admin/customer-galleries/${result.gallery.customer_name_slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawDownloadEnabled: nextValue }),
    });
    const data = (await response.json()) as { gallery: CreatedGallery["gallery"] };

    if (response.ok) {
      setResult((current) => current ? { ...current, gallery: { ...current.gallery, raw_download_enabled: data.gallery.raw_download_enabled } } : current);
    }
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Tạo thư mục khách hàng TLORA</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Tạo thư mục theo tên khách và 2 thư mục con FILE GỐC, FILE CHỈNH SỬA trong Google Drive.
          </p>
        </div>
        <Plus className="text-rose-600" size={24} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Tên
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-900"
            placeholder="Nguyễn Minh Anh"
          />
        </label>
        <label className="block text-sm font-semibold">
          Ngày chụp
          <input
            value={shootDate}
            onChange={(event) => setShootDate(event.target.value)}
            type="date"
            className="mt-2 h-11 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-900"
          />
        </label>
      </div>
      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      {notice && <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{notice}</div>}
      <button
        onClick={createGallery}
        disabled={loading}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
        Tạo thư mục
      </button>
      {result && (
        <div className="mt-5 space-y-3 rounded-md bg-stone-50 p-4">
          <LinkRow label="Link FILE GỐC" value={result.gallery.raw_drive_folder_url} copied={copied === "raw"} onCopy={() => copy(result.gallery.raw_drive_folder_url, "raw")} />
          <LinkRow label="Link FILE CHỈNH SỬA" value={result.gallery.edited_drive_folder_url} copied={copied === "edited"} onCopy={() => copy(result.gallery.edited_drive_folder_url, "edited")} />
          <LinkRow label="Link khách hàng" value={result.customerUrl} copied={copied === "customer"} onCopy={() => copy(result.customerUrl, "customer")} />
          <div className="flex flex-wrap gap-3">
            <button onClick={syncPhotos} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold">
              <RefreshCw size={16} /> Đồng bộ ảnh sau khi upload
            </button>
            <button onClick={toggleRawDownload} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white">
              {result.gallery.raw_download_enabled ? "Tắt tải FILE GỐC" : "Mở tải FILE GỐC khi đã thanh toán"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function LinkRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[140px_1fr_auto] md:items-center">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <a href={value} target="_blank" rel="noreferrer" className="truncate rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 hover:text-zinc-950">
        {value}
      </a>
      <button onClick={onCopy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white">
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Đã copy" : "Copy"}
      </button>
    </div>
  );
}
