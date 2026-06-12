"use client";

import {
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  FolderSync,
  ImageUp,
  Link as LinkIcon,
  RefreshCw,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { CustomerGalleryCreator } from "@/components/admin/customer-gallery-creator";
import { adminMenu } from "@/lib/site-data";

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
  editedPhotoCount: number;
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

type AdminView = "dashboard" | "album-manager" | "edit-requests" | "placeholder";

type AdminStudioWorkspaceProps = {
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  databaseError?: string;
};

export function AdminStudioWorkspace({ galleries, editRequests, databaseError }: AdminStudioWorkspaceProps) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const activeView = getViewFromMenu(activeMenu);

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-zinc-950">
      <div className="grid lg:grid-cols-[288px_1fr]">
        <aside className="border-r border-zinc-200/80 bg-white px-4 py-5 lg:sticky lg:top-0 lg:min-h-screen">
          <div className="flex items-center gap-3 rounded-md bg-zinc-950 p-3 text-white">
            <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} className="h-11 w-auto object-contain" />
            <div>
              <p className="font-heading text-base font-bold">TLORA Admin</p>
              <p className="text-xs text-zinc-300">Management Console</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {adminMenu.map((item) => {
              const isActive = item === activeMenu;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveMenu(item)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {getMenuIcon(item)}
                  <span className="truncate">{item}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          {databaseError && (
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              Chưa đọc được dữ liệu album: {databaseError}
            </div>
          )}

          {activeView === "dashboard" && (
            <DashboardView galleries={galleries} editRequests={editRequests} />
          )}

          {activeView === "album-manager" && (
            <AlbumManagerView initialGalleries={galleries} editRequests={editRequests} />
          )}

          {activeView === "edit-requests" && (
            <EditRequestsView editRequests={editRequests} />
          )}

          {activeView === "placeholder" && (
            <PlaceholderView />
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardView({ galleries, editRequests }: { galleries: AdminGallery[]; editRequests: AdminEditRequest[] }) {
  const totalJobs = galleries.length;
  const completedJobs = galleries.filter((gallery) => gallery.editedPhotoCount > 0).length;
  const pendingJobs = Math.max(totalJobs - completedJobs, 0);
  const selectedCount = galleries.reduce((total, gallery) => total + gallery.selectedPhotoCount, 0);
  const openRawCount = galleries.filter((gallery) => gallery.rawDownloadEnabled).length;
  const revenue = completedJobs * 1900000;

  return (
    <div className="space-y-5">
      <HeaderCard
        title="Dashboard"
        description="Tổng quan job, doanh thu, tiến độ hoàn thiện và trạng thái album."
        action="Báo cáo tổng quan"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Tổng job" value={totalJobs.toString()} helper="Album đã tạo" />
        <Metric label="Doanh thu" value={formatCurrency(revenue)} helper="Tạm tính từ job hoàn thiện" />
        <Metric label="Job hoàn thiện" value={completedJobs.toString()} helper="Đã có file chỉnh sửa" />
        <Metric label="Job chưa hoàn thiện" value={pendingJobs.toString()} helper="Chưa có file chỉnh sửa" />
        <Metric label="Ảnh cần sửa" value={editRequests.length.toString()} helper={`${selectedCount} ảnh đã chọn`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-950">Biểu đồ tiến độ job</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Tỷ lệ album hoàn thiện, chưa hoàn thiện và đang mở tải FILE GỐC.</p>
            </div>
            <BarChart3 size={22} className="text-zinc-500" />
          </div>
          <div className="mt-6 space-y-5">
            <ProgressRow label="Hoàn thiện" value={completedJobs} total={Math.max(totalJobs, 1)} tone="bg-emerald-600" />
            <ProgressRow label="Chưa hoàn thiện" value={pendingJobs} total={Math.max(totalJobs, 1)} tone="bg-amber-500" />
            <ProgressRow label="Đang mở FILE GỐC" value={openRawCount} total={Math.max(totalJobs, 1)} tone="bg-sky-600" />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-950">Việc cần chú ý</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-700">
            <StatusLine label="Ảnh chờ chỉnh" value={`${editRequests.length} ảnh`} />
            <StatusLine label="Album chưa hoàn thiện" value={`${pendingJobs} job`} />
            <StatusLine label="Album đang mở tải gốc" value={`${openRawCount} album`} />
          </div>
        </section>
      </div>
    </div>
  );
}

function AlbumManagerView({
  initialGalleries,
  editRequests,
}: {
  initialGalleries: AdminGallery[];
  editRequests: AdminEditRequest[];
}) {
  const [galleries, setGalleries] = useState(initialGalleries);
  const [expandedId, setExpandedId] = useState<string | null>(initialGalleries[0]?.id ?? null);
  const [copiedId, setCopiedId] = useState("");
  const [busyId, setBusyId] = useState("");

  const requestsByGallery = useMemo(() => {
    return editRequests.reduce<Record<string, AdminEditRequest[]>>((grouped, request) => {
      grouped[request.galleryId] = [...(grouped[request.galleryId] || []), request];
      return grouped;
    }, {});
  }, [editRequests]);

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1200);
  }

  async function syncGallery(slug: string, id: string) {
    setBusyId(`sync-${id}`);
    await fetch(`/api/customer-galleries/${slug}/sync`, { method: "POST" });
    window.location.reload();
  }

  async function toggleRawDownload(gallery: AdminGallery) {
    setBusyId(`raw-${gallery.id}`);
    const nextValue = !gallery.rawDownloadEnabled;
    const response = await fetch(`/api/admin/customer-galleries/${gallery.customerSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawDownloadEnabled: nextValue }),
    });

    if (response.ok) {
      setGalleries((current) => current.map((item) => item.id === gallery.id ? { ...item, rawDownloadEnabled: nextValue } : item));
    }

    setBusyId("");
  }

  return (
    <div className="space-y-5">
      <HeaderCard
        title="Quản lý album khách hàng"
        description="Quản lý link khách, Google Drive, quyền tải FILE GỐC và danh sách file khách cần chỉnh."
        action="Google Drive workflow"
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <CustomerGalleryCreator />
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-950">Quy trình file</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
            <p>1. Tạo album và gửi link khách đầy đủ.</p>
            <p>2. Đồng bộ FILE GỐC sau khi upload ảnh.</p>
            <p>3. Khách chọn ảnh và nhập nội dung cần chỉnh.</p>
            <p>4. Mở từng album trong bảng để xem tên file và ghi chú.</p>
            <p>5. Đóng hoặc mở tải FILE GỐC theo trạng thái thanh toán.</p>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-bold">Bảng quản lý album</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Bấm mở từng album để xem bảng file: tên file và nội dung cần chỉnh sửa.
            </p>
          </div>
          <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">
            {galleries.length} album
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-3 pr-4">Album</th>
                <th className="py-3 pr-4">Ngày chụp</th>
                <th className="py-3 pr-4">Link khách</th>
                <th className="py-3 pr-4">Google Drive</th>
                <th className="py-3 pr-4">File</th>
                <th className="py-3 pr-4">Quyền tải FILE GỐC</th>
                <th className="py-3 pr-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {galleries.map((gallery) => {
                const galleryRequests = requestsByGallery[gallery.id] || [];
                const isExpanded = expandedId === gallery.id;

                return (
                  <FragmentRow
                    key={gallery.id}
                    gallery={gallery}
                    requests={galleryRequests}
                    isExpanded={isExpanded}
                    copiedId={copiedId}
                    busyId={busyId}
                    onCopy={copy}
                    onSync={syncGallery}
                    onToggleRaw={toggleRawDownload}
                    onToggleExpanded={() => setExpandedId(isExpanded ? null : gallery.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {galleries.length === 0 && <EmptyText text="Chưa có album khách hàng nào." />}
      </section>
    </div>
  );
}

function FragmentRow({
  gallery,
  requests,
  isExpanded,
  copiedId,
  busyId,
  onCopy,
  onSync,
  onToggleRaw,
  onToggleExpanded,
}: {
  gallery: AdminGallery;
  requests: AdminEditRequest[];
  isExpanded: boolean;
  copiedId: string;
  busyId: string;
  onCopy: (value: string, id: string) => void;
  onSync: (slug: string, id: string) => void;
  onToggleRaw: (gallery: AdminGallery) => void;
  onToggleExpanded: () => void;
}) {
  return (
    <>
      <tr className="align-top text-zinc-700">
        <td className="py-4 pr-4">
          <button type="button" onClick={onToggleExpanded} className="flex items-start gap-2 text-left">
            <ChevronDown className={`mt-0.5 shrink-0 transition ${isExpanded ? "" : "-rotate-90"}`} size={17} />
            <span>
              <span className="block font-semibold text-zinc-950">{gallery.customerName}</span>
              <span className="mt-1 block text-xs text-zinc-500">/{gallery.customerSlug}</span>
            </span>
          </button>
        </td>
        <td className="py-4 pr-4">{formatDate(gallery.shootDate)}</td>
        <td className="py-4 pr-4">
          <LinkWithCopy
            value={gallery.customerUrl}
            copied={copiedId === `${gallery.id}-customer`}
            onCopy={() => onCopy(gallery.customerUrl, `${gallery.id}-customer`)}
          />
        </td>
        <td className="py-4 pr-4">
          <div className="flex flex-wrap gap-2">
            <DriveLink href={gallery.rawDriveUrl} label="FILE GỐC" />
            <DriveLink href={gallery.editedDriveUrl} label="FILE CHỈNH SỬA" />
          </div>
        </td>
        <td className="py-4 pr-4">
          <p className="font-bold text-zinc-950">{gallery.selectedPhotoCount}/{gallery.rawPhotoCount}</p>
          <p className="mt-1 text-xs text-zinc-500">{requests.length} file cần chỉnh</p>
        </td>
        <td className="py-4 pr-4">
          <button
            type="button"
            onClick={() => onToggleRaw(gallery)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 font-semibold ${
              gallery.rawDownloadEnabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {busyId === `raw-${gallery.id}` && <RefreshCw className="animate-spin" size={14} />}
            {gallery.rawDownloadEnabled ? "Đang mở tải" : "Đang khóa"}
          </button>
        </td>
        <td className="py-4 pr-4 text-right">
          <button
            type="button"
            onClick={() => onSync(gallery.customerSlug, gallery.id)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white"
          >
            <RefreshCw className={busyId === `sync-${gallery.id}` ? "animate-spin" : ""} size={16} />
            Đồng bộ
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-zinc-50 px-4 py-4">
            <EditFileTable requests={requests} />
          </td>
        </tr>
      )}
    </>
  );
}

function EditRequestsView({ editRequests }: { editRequests: AdminEditRequest[] }) {
  return (
    <div className="space-y-5">
      <HeaderCard
        title="Ảnh cần sửa"
        description="Bảng tổng hợp tên file, khách hàng và nội dung cần chỉnh từ toàn bộ album."
        action={`${editRequests.length} ảnh`}
      />
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <EditRequestsTable requests={editRequests} />
      </section>
    </div>
  );
}

function EditFileTable({ requests }: { requests: AdminEditRequest[] }) {
  if (requests.length === 0) {
    return <EmptyText text="Album này chưa có file nào được khách chọn hoặc ghi chú cần chỉnh." />;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-white text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Tên file</th>
            <th className="px-4 py-3">Nội dung cần chỉnh sửa</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Xem ảnh</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {requests.map((request) => (
            <tr key={request.id} className="align-top text-zinc-700">
              <td className="px-4 py-3 font-semibold text-zinc-950">{request.fileName}</td>
              <td className="px-4 py-3">
                <p className="max-w-[440px] whitespace-pre-wrap leading-6">{request.editNote?.trim() || "Khách chưa nhập ghi chú."}</p>
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-emerald-700">{request.selected ? "Khách đã chọn" : "Có ghi chú"}</td>
              <td className="px-4 py-3 text-right">
                <PreviewLink request={request} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditRequestsTable({ requests }: { requests: AdminEditRequest[] }) {
  if (requests.length === 0) {
    return <EmptyText text="Chưa có ảnh nào được khách chọn hoặc ghi chú cần chỉnh." />;
  }

  return (
    <div className="overflow-x-auto">
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
                <PreviewLink request={request} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCard({ title, description, action }: { title: string; description: string; action: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
            <Check size={14} />
            Admin và staff
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-normal text-zinc-950 md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
          <FolderSync size={18} className="text-zinc-500" />
          <span>{action}</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-zinc-950">{value}</p>
      <p className="mt-2 text-xs font-medium text-zinc-500">{helper}</p>
    </article>
  );
}

function ProgressRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const percent = Math.round((value / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-zinc-700">
        <span>{label}</span>
        <span>{value} job</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-3">
      <span>{label}</span>
      <span className="font-bold text-zinc-950">{value}</span>
    </div>
  );
}

function LinkWithCopy({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex max-w-[300px] items-center gap-2">
      <a href={value} target="_blank" rel="noreferrer" className="truncate rounded-md border border-zinc-200 px-3 py-2 text-zinc-600 hover:text-zinc-950">
        {value}
      </a>
      <button type="button" onClick={onCopy} className="grid size-10 shrink-0 place-items-center rounded-md bg-zinc-950 text-white" aria-label="Copy link">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function DriveLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 font-semibold hover:bg-zinc-50">
      {label} <ExternalLink size={14} />
    </a>
  );
}

function PreviewLink({ request }: { request: AdminEditRequest }) {
  if (!request.previewUrl && !request.downloadUrl) {
    return <span className="text-zinc-400">Không có preview</span>;
  }

  return (
    <a href={request.previewUrl || request.downloadUrl || ""} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-md bg-zinc-950 px-3 font-semibold text-white">
      Xem file <ExternalLink size={14} />
    </a>
  );
}

function PlaceholderView() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <FileText className="mx-auto text-zinc-400" size={36} />
      <h1 className="mt-4 text-2xl font-bold text-zinc-950">Mục này đang chờ cấu hình</h1>
      <p className="mt-2 text-sm text-zinc-600">Dashboard và Quản lý album đã được tách riêng để dễ vận hành.</p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500">
      {text}
    </div>
  );
}

function getViewFromMenu(item: string): AdminView {
  if (item === "Dashboard") return "dashboard";
  if (item === "Quản lý album khách hàng" || item === "Album") return "album-manager";
  if (item === "Ảnh cần sửa") return "edit-requests";
  return "placeholder";
}

function getMenuIcon(item: string) {
  if (item === "Dashboard") return <BarChart3 size={17} />;
  if (item === "Quản lý album khách hàng" || item === "Album") return <LinkIcon size={17} />;
  if (item === "Ảnh cần sửa") return <ImageUp size={17} />;
  if (item === "Cài đặt") return <Settings size={17} />;
  return <span className="size-2 rounded-full bg-current" />;
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
