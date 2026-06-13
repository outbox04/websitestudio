"use client";

import { Check, Copy, ExternalLink, Loader2, Lock, RefreshCw, Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ManagedGallery = {
  id: string;
  customer_name: string;
  customer_name_slug: string;
  shoot_date: string;
  raw_drive_folder_url: string;
  edited_drive_folder_url: string;
  raw_download_enabled: boolean;
  edited_download_enabled: boolean;
  created_at: string;
  customerUrl: string;
  customerDoneUrl: string;
  selected_photo_file_names: string[];
  selected_photo_count: number;
};

type LoadingAction = {
  slug: string;
  key: "sync" | "raw" | "edited";
} | null;

export function CustomerGalleryManager() {
  const [galleries, setGalleries] = useState<ManagedGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const visibleGalleries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return galleries;

    return galleries.filter((gallery) =>
      [gallery.customer_name, gallery.customer_name_slug]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [galleries, query]);

  async function loadGalleries() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/customer-galleries", { cache: "no-store" });
      const data = (await response.json()) as { galleries?: ManagedGallery[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Không tải được danh sách album");
      }

      setGalleries(data.galleries || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tải được danh sách album");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    function handleGalleryChanged() {
      void loadGalleries();
    }

    async function loadInitialGalleries() {
      try {
        const response = await fetch("/api/admin/customer-galleries", { cache: "no-store" });
        const data = (await response.json()) as { galleries?: ManagedGallery[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Không tải được danh sách album");
        }

        if (active) {
          setGalleries(data.galleries || []);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Không tải được danh sách album");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    window.addEventListener("customer-gallery:changed", handleGalleryChanged);
    void loadInitialGalleries();

    return () => {
      active = false;
      window.removeEventListener("customer-gallery:changed", handleGalleryChanged);
    };
  }, []);

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1200);
  }

  async function copySelectedFileNames(gallery: ManagedGallery) {
    const value = gallery.selected_photo_file_names.join(", ");
    await navigator.clipboard.writeText(value);
    setCopied(`${gallery.id}:selected-files`);
    window.setTimeout(() => setCopied(""), 1200);
  }

  async function syncPhotos(slug: string) {
    setLoadingAction({ slug, key: "sync" });
    setError("");

    try {
      const response = await fetch(`/api/customer-galleries/${slug}/sync`, { method: "POST" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Không đồng bộ được ảnh");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không đồng bộ được ảnh");
    } finally {
      setLoadingAction(null);
    }
  }

  async function toggleDownload(gallery: ManagedGallery, key: "raw" | "edited") {
    const nextRaw = key === "raw" ? !gallery.raw_download_enabled : gallery.raw_download_enabled;
    const nextEdited = key === "edited" ? !gallery.edited_download_enabled : gallery.edited_download_enabled;
    const body = key === "raw" ? { rawDownloadEnabled: nextRaw } : { editedDownloadEnabled: nextEdited };

    setLoadingAction({ slug: gallery.customer_name_slug, key });
    setError("");

    try {
      const response = await fetch(`/api/admin/customer-galleries/${gallery.customer_name_slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { gallery?: ManagedGallery; error?: string };

      if (!response.ok || !data.gallery) {
        throw new Error(data.error || "Không cập nhật được trạng thái tải");
      }

      const updatedGallery = data.gallery;
      setGalleries((current) =>
        current.map((item) =>
          item.id === gallery.id
            ? {
                ...item,
                raw_download_enabled: updatedGallery.raw_download_enabled,
                edited_download_enabled: updatedGallery.edited_download_enabled,
              }
            : item,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không cập nhật được trạng thái tải");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section id="quan-ly-album-khach-hang" className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Quản lý album khách hàng</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Quản lý link gửi khách, thư mục Drive, đồng bộ ảnh và quyền tải theo từng album.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-900 lg:w-56"
            placeholder="Tìm khách hàng"
          />
          <button onClick={loadGalleries} className="inline-grid size-10 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" aria-label="Tải lại">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-3 pr-4">Khách hàng</th>
              <th className="pr-4">Ngày chụp</th>
              <th className="pr-4">Link khách</th>
              <th className="pr-4">Google Drive</th>
              <th className="pr-4">File cần chỉnh</th>
              <th className="pr-4">Quyền tải</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visibleGalleries.map((gallery) => (
              <tr key={gallery.id} className="align-top text-zinc-700 hover:bg-zinc-50/70">
                <td className="py-4 pr-4">
                  <p className="font-semibold text-zinc-950">{gallery.customer_name}</p>
                  <p className="mt-1 text-xs text-zinc-500">/{gallery.customer_name_slug}</p>
                </td>
                <td className="py-4 pr-4">{new Date(gallery.shoot_date).toLocaleDateString("vi-VN")}</td>
                <td className="py-4 pr-4">
                  <div className="flex flex-col gap-2">
                    <LinkAction
                      label="FILE GỐC"
                      href={gallery.customerUrl}
                      copied={copied === `${gallery.id}:customer`}
                      onCopy={() => copy(gallery.customerUrl, `${gallery.id}:customer`)}
                    />
                    <LinkAction
                      label="HOÀN THIỆN"
                      href={gallery.customerDoneUrl}
                      copied={copied === `${gallery.id}:customer-done`}
                      onCopy={() => copy(gallery.customerDoneUrl, `${gallery.id}:customer-done`)}
                    />
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex flex-col gap-2">
                    <LinkAction
                      label="FILE GỐC"
                      href={gallery.raw_drive_folder_url}
                      copied={copied === `${gallery.id}:raw-drive`}
                      onCopy={() => copy(gallery.raw_drive_folder_url, `${gallery.id}:raw-drive`)}
                    />
                    <LinkAction
                      label="FILE CHỈNH"
                      href={gallery.edited_drive_folder_url}
                      copied={copied === `${gallery.id}:edited-drive`}
                      onCopy={() => copy(gallery.edited_drive_folder_url, `${gallery.id}:edited-drive`)}
                    />
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex flex-col items-start gap-2">
                    <button
                      onClick={() => void copySelectedFileNames(gallery)}
                      disabled={gallery.selected_photo_file_names.length === 0}
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copied === `${gallery.id}:selected-files` ? <Check size={16} /> : <Copy size={16} />}
                      {copied === `${gallery.id}:selected-files` ? "Đã copy" : "Copy tên file"}
                    </button>
                    <p className="text-xs text-zinc-500">{gallery.selected_photo_count} file cần chỉnh</p>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex flex-col gap-2">
                    <DownloadToggle
                      enabled={gallery.raw_download_enabled}
                      label="File gốc"
                      loading={loadingAction?.slug === gallery.customer_name_slug && loadingAction.key === "raw"}
                      onClick={() => toggleDownload(gallery, "raw")}
                    />
                    <DownloadToggle
                      enabled={gallery.edited_download_enabled}
                      label="File đã chỉnh"
                      loading={loadingAction?.slug === gallery.customer_name_slug && loadingAction.key === "edited"}
                      onClick={() => toggleDownload(gallery, "edited")}
                    />
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => syncPhotos(gallery.customer_name_slug)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      {loadingAction?.slug === gallery.customer_name_slug && loadingAction.key === "sync" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                      Đồng bộ ảnh
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && visibleGalleries.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
            Chưa có album khách hàng phù hợp.
          </div>
        )}
      </div>
    </section>
  );
}

function LinkAction({
  href,
  copied,
  onCopy,
  label,
}: {
  href: string;
  copied: boolean;
  onCopy: () => void;
  label?: string;
}) {
  return (
    <div className="flex max-w-[280px] items-center gap-2">
      {label && <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">{label}</span>}
      <a href={href} target="_blank" rel="noreferrer" className="truncate text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline">
        {href}
      </a>
      <a href={href} target="_blank" rel="noreferrer" className="grid size-8 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" aria-label="Mở link">
        <ExternalLink size={14} />
      </a>
      <button onClick={onCopy} className="grid size-8 shrink-0 place-items-center rounded-md bg-zinc-950 text-white hover:bg-zinc-800" aria-label="Copy link">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function DownloadToggle({
  enabled,
  label,
  loading,
  onClick,
}: {
  enabled: boolean;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold ring-1 ${
        enabled ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-zinc-100 text-zinc-600 ring-zinc-200"
      }`}
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : enabled ? <Unlock size={14} /> : <Lock size={14} />}
      {label}: {enabled ? "Đang mở" : "Đang khóa"}
    </button>
  );
}
