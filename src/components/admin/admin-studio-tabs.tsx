"use client";

import {
  Check,
  Copy,
  ExternalLink,
  ImageUp,
  LayoutDashboard,
  Link as LinkIcon,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerGalleryCreator } from "@/components/admin/customer-gallery-creator";

export type AdminGallery = {
  id: string;
  customerName: string;
  customerSlug: string;
  shootDate: string;
  customerUrl: string;
  rawDriveUrl: string;
  editedDriveUrl: string;
  rawDownloadEnabled: boolean;
  rawPhotoCount: number;
  selectedPhotoCount: number;
};

export type AdminEditRequest = {
  id: string;
  galleryId: string;
  customerName: string;
  customerSlug: string;
  shootDate: string;
  customerUrl: string;
  fileName: string;
  editNote: string | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  updatedAt: string;
  selected: boolean;
};

type AdminStudioTabsProps = {
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  databaseError?: string;
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "albums", label: "Quản lý album khách hàng", icon: LinkIcon },
  { id: "requests", label: "Ảnh cần sửa", icon: ImageUp },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AdminStudioTabs({ galleries, editRequests, databaseError }: AdminStudioTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const selectedCount = useMemo(
    () => galleries.reduce((total, gallery) => total + gallery.selectedPhotoCount, 0),
    [galleries],
  );

  return (
    <div className="space-y-6">
      {databaseError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Chưa đọc được dữ liệu album: {databaseError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-md border border-zinc-200 bg-white p-1 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex min-h-11 items-center gap-2 rounded px-4 text-sm font-semibold transition ${
              activeTab === id ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <DashboardTab
          galleries={galleries}
          editRequests={editRequests}
          selectedCount={selectedCount}
        />
      )}

      {activeTab === "albums" && <AlbumManagementTab galleries={galleries} />}

      {activeTab === "requests" && <EditRequestsTable requests={editRequests} />}
    </div>
  );
}

function DashboardTab({
  galleries,
  editRequests,
  selectedCount,
}: {
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  selectedCount: number;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Album khách hàng" value={galleries.length.toString()} />
        <Stat label="Ảnh đã chọn" value={selectedCount.toString()} />
        <Stat label="Ảnh cần sửa" value={editRequests.length.toString()} />
        <Stat label="Album đang mở tải" value={galleries.filter((gallery) => gallery.rawDownloadEnabled).length.toString()} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <CustomerGalleryCreator />
        <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Quy trình TLORA</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Checklist vận hành album từ lúc tạo thư mục đến khi giao file.
              </p>
            </div>
            <Settings className="text-zinc-950" size={22} />
          </div>
          <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-600">
            <p>1. Tạo thư mục khách hàng trong thư mục gốc TLORA.</p>
            <p>2. Upload ảnh vào link FILE GỐC, sau đó bấm đồng bộ ảnh.</p>
            <p>3. Gửi link khách hàng đầy đủ để khách chọn ảnh và nhập ghi chú.</p>
            <p>4. Xem tab Ảnh cần sửa để lấy tên file và nội dung cần chỉnh.</p>
            <p>5. Upload ảnh hoàn thiện vào FILE CHỈNH SỬA để khách tải ở tab cuối.</p>
          </div>
        </section>
      </div>

      <EditRequestsTable requests={editRequests.slice(0, 8)} compact />
    </>
  );
}

function AlbumManagementTab({ galleries }: { galleries: AdminGallery[] }) {
  const [copiedId, setCopiedId] = useState("");
  const [syncingId, setSyncingId] = useState("");

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1200);
  }

  async function syncGallery(slug: string, id: string) {
    setSyncingId(id);
    await fetch(`/api/customer-galleries/${slug}/sync`, { method: "POST" });
    window.location.reload();
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">Quản lý album khách hàng</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Mỗi album có link khách đầy đủ, link Google Drive và số ảnh khách đã chọn.
          </p>
        </div>
        <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">
          {galleries.length} album
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-3 pr-4">Khách hàng</th>
              <th className="py-3 pr-4">Ngày chụp</th>
              <th className="py-3 pr-4">Link khách đầy đủ</th>
              <th className="py-3 pr-4">Google Drive</th>
              <th className="py-3 pr-4">Ảnh đã chọn</th>
              <th className="py-3 pr-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {galleries.map((gallery) => (
              <tr key={gallery.id} className="align-top text-zinc-700">
                <td className="py-4 pr-4">
                  <p className="font-semibold text-zinc-950">{gallery.customerName}</p>
                  <p className="mt-1 text-xs text-zinc-500">/{gallery.customerSlug}</p>
                </td>
                <td className="py-4 pr-4">{formatDate(gallery.shootDate)}</td>
                <td className="py-4 pr-4">
                  <LinkWithCopy
                    value={gallery.customerUrl}
                    copied={copiedId === `${gallery.id}-customer`}
                    onCopy={() => copy(gallery.customerUrl, `${gallery.id}-customer`)}
                  />
                </td>
                <td className="py-4 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <a href={gallery.rawDriveUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 font-semibold hover:bg-zinc-50">
                      FILE GỐC <ExternalLink size={14} />
                    </a>
                    <a href={gallery.editedDriveUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 font-semibold hover:bg-zinc-50">
                      FILE CHỈNH SỬA <ExternalLink size={14} />
                    </a>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <p className="font-bold text-zinc-950">{gallery.selectedPhotoCount}/{gallery.rawPhotoCount}</p>
                  <p className="mt-1 text-xs text-zinc-500">{gallery.rawDownloadEnabled ? "FILE GỐC đang mở tải" : "FILE GỐC đang khóa"}</p>
                </td>
                <td className="py-4 pr-4 text-right">
                  <button
                    type="button"
                    onClick={() => syncGallery(gallery.customerSlug, gallery.id)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white"
                  >
                    <RefreshCw className={syncingId === gallery.id ? "animate-spin" : ""} size={16} />
                    Đồng bộ ảnh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {galleries.length === 0 && <EmptyText text="Chưa có album khách hàng nào." />}
    </section>
  );
}

function EditRequestsTable({ requests, compact = false }: { requests: AdminEditRequest[]; compact?: boolean }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">{compact ? "Ảnh cần sửa mới nhất" : "Bảng tổng hợp ảnh cần sửa"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Admin xem ngay tên file, khách hàng và nội dung cần chỉnh mà không phải mở từng ảnh.
          </p>
        </div>
        <span className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {requests.length} ảnh
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-3 pr-4">Khách hàng</th>
              <th className="py-3 pr-4">Tên file</th>
              <th className="py-3 pr-4">Cần sửa</th>
              <th className="py-3 pr-4">Link khách</th>
              <th className="py-3 pr-4">Xem ảnh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requests.map((request) => (
              <tr key={request.id} className="align-top text-zinc-700">
                <td className="py-4 pr-4">
                  <p className="font-semibold text-zinc-950">{request.customerName}</p>
                  <p className="mt-1 text-xs text-zinc-500">{formatDate(request.shootDate)}</p>
                </td>
                <td className="py-4 pr-4">
                  <p className="max-w-[220px] break-words font-semibold text-zinc-950">{request.fileName}</p>
                  <p className="mt-1 text-xs text-emerald-700">{request.selected ? "Khách đã chọn" : "Có ghi chú"}</p>
                </td>
                <td className="py-4 pr-4">
                  <p className="max-w-[360px] whitespace-pre-wrap leading-6">
                    {request.editNote?.trim() || "Khách chưa nhập ghi chú."}
                  </p>
                </td>
                <td className="py-4 pr-4">
                  <a href={request.customerUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 font-semibold hover:bg-zinc-50">
                    Mở album <ExternalLink size={14} />
                  </a>
                </td>
                <td className="py-4 pr-4">
                  {request.previewUrl || request.downloadUrl ? (
                    <a href={request.previewUrl || request.downloadUrl || ""} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-md bg-zinc-950 px-3 font-semibold text-white">
                      Xem file <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-zinc-400">Không có preview</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {requests.length === 0 && <EmptyText text="Chưa có ảnh nào được khách chọn hoặc ghi chú cần chỉnh." />}
    </section>
  );
}

function LinkWithCopy({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex max-w-[320px] items-center gap-2">
      <a href={value} target="_blank" rel="noreferrer" className="truncate rounded-md border border-zinc-200 px-3 py-2 text-zinc-600 hover:text-zinc-950">
        {value}
      </a>
      <button type="button" onClick={onCopy} className="grid size-10 shrink-0 place-items-center rounded-md bg-zinc-950 text-white" aria-label="Copy link">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </article>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}
