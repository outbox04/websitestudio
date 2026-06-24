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
  Landmark,
  Link as LinkIcon,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import { CustomerGalleryCreator } from "@/components/admin/customer-gallery-creator";
import { StudioDriveConnection } from "@/components/admin/studio-drive-connection";
import { StudioNewsManager } from "@/components/admin/studio-news-manager";
import { StudioSiteBuilder } from "@/components/admin/studio-site-builder";
import { adminMenu } from "@/lib/site-data";

export type AdminGallery = {
  id: string;
  customerName: string;
  customerSlug: string;
  shootDate: string;
  customerUrl: string;
  customerDoneUrl: string;
  rawDriveUrl: string;
  editedDriveUrl: string;
  rawDownloadEnabled: boolean;
  editedDownloadEnabled: boolean;
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
  customerDoneUrl: string;
  fileName: string;
  editNote: string | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  updatedAt: string;
  selected: boolean;
};

type AdminView = "dashboard" | "album-manager" | "edit-requests" | "payment-settings" | "news" | "site-builder" | "placeholder";

type AdminStudioWorkspaceProps = {
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  databaseError?: string;
  studioName?: string;
  tenantMode?: boolean;
  studioSlug?: string;
  studioSettings?: any;
};

export function AdminStudioWorkspace({
  galleries,
  editRequests,
  databaseError,
  studioName,
  tenantMode = false,
  studioSlug = "",
  studioSettings = {},
}: AdminStudioWorkspaceProps) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const activeView = getViewFromMenu(activeMenu);
  const menu = adminMenu;

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-zinc-950">
      <div className="grid lg:grid-cols-[288px_1fr]">
        <aside className="border-r border-zinc-200/80 bg-white px-4 py-5 lg:sticky lg:top-0 lg:min-h-screen">
          <div className="flex items-center gap-3 rounded-md bg-zinc-950 p-3 text-white">
            <Image src="/brand/tlora-logo.png" alt="TLORA Studio" width={1536} height={1024} className="h-11 w-auto object-contain" />
            <div>
              <p className="font-heading text-base font-bold">{studioName || "TLORA Admin"}</p>
              <p className="text-xs text-zinc-300">{studioName ? "Studio Management" : "Management Console"}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {menu.map((item) => {
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
            <DashboardView
              galleries={galleries}
              editRequests={editRequests}
              tenantMode={tenantMode}
              studioSlug={studioSlug}
              studioSettings={studioSettings}
            />
          )}

          {activeView === "album-manager" && (
            <AlbumManagerView initialGalleries={galleries} editRequests={editRequests} />
          )}

          {activeView === "edit-requests" && (
            <EditRequestsView editRequests={editRequests} />
          )}

          {activeView === "payment-settings" && (tenantMode ? <StudioSiteBuilder mode="settings" studioSettings={studioSettings} /> : <PaymentSettingsView />)}

          {activeView === "news" && <StudioNewsManager />}
          {activeView === "site-builder" && <StudioSiteBuilder mode="builder" studioSettings={studioSettings} />}

          {activeView === "placeholder" && (
            <PlaceholderView />
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardView({
  galleries,
  editRequests,
  tenantMode,
  studioSlug,
  studioSettings,
}: {
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  tenantMode: boolean;
  studioSlug: string;
  studioSettings: any;
}) {
  const [setupCompleted, setSetupCompleted] = useState(Boolean(studioSettings?.setup_completed));
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState("");

  const totalJobs = galleries.length;
  const completedJobs = galleries.filter((gallery) => gallery.editedPhotoCount > 0).length;
  const pendingJobs = Math.max(totalJobs - completedJobs, 0);
  const selectedCount = galleries.reduce((total, gallery) => total + gallery.selectedPhotoCount, 0);
  const openRawCount = galleries.filter((gallery) => gallery.rawDownloadEnabled).length;
  const revenue = completedJobs * 1900000;

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tlgroup.site";

  async function handleSetupWebsite() {
    setIsSettingUp(true);
    setSetupError("");
    try {
      const response = await fetch("/api/admin/setup-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể setup website.");
      }
      setSetupCompleted(true);
      window.location.reload();
    } catch (err: any) {
      setSetupError(err.message || "Đã xảy ra lỗi trong quá trình thiết lập.");
    } finally {
      setIsSettingUp(false);
    }
  }

  return (
    <div className="space-y-5">
      {tenantMode && (
        <>
          {setupCompleted ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
                    <Check className="text-emerald-600" size={20} />
                    Website đã được đưa vào vận hành chính thức!
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Trang chủ của studio hiện đã sẵn sàng phục vụ khách hàng. Bạn có thể truy cập trang chủ để xem giao diện dịch vụ, bảng giá và portfolio album mẫu.
                  </p>
                </div>
                <a
                  href={`https://${studioSlug}.${rootDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition-all"
                >
                  Xem website của tôi <ExternalLink size={15} />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-amber-950">
                    <Sparkles className="text-amber-600 animate-pulse" size={20} />
                    Website của bạn chưa được đưa vào vận hành
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Trang chủ subdomain hiện tại đang hiển thị thông báo "Website đang hoàn thiện". Nhấp nút bên dưới để tạo các dữ liệu mẫu (album, ảnh, tin tức, tài khoản ngân hàng) và đưa website vào hoạt động chính thức ngay lập tức!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSetupWebsite}
                  disabled={isSettingUp}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-amber-600 hover:bg-amber-700 px-5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSettingUp ? (
                    <>
                      <RefreshCw className="animate-spin" size={15} /> Đang thiết lập...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Setup & Vận hành ngay
                    </>
                  )}
                </button>
              </div>
              {setupError && (
                <p className="mt-3 text-xs font-semibold text-red-600">{setupError}</p>
              )}
            </div>
          )}
          <StudioDriveConnection />
        </>
      )}
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

  async function toggleDownload(gallery: AdminGallery) {
    setBusyId(`download-${gallery.id}`);
    const nextValue = !(gallery.rawDownloadEnabled && gallery.editedDownloadEnabled);
    const response = await fetch(`/api/admin/customer-galleries/${gallery.customerSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawDownloadEnabled: nextValue, editedDownloadEnabled: nextValue }),
    });

    if (response.ok) {
      setGalleries((current) => current.map((item) => item.id === gallery.id ? { ...item, rawDownloadEnabled: nextValue, editedDownloadEnabled: nextValue } : item));
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
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-3 pr-4">Album</th>
                <th className="py-3 pr-4">Ngày chụp</th>
                <th className="py-3 pr-4">Link khách</th>
                <th className="py-3 pr-4">Google Drive</th>
                <th className="py-3 pr-4">File</th>
                <th className="py-3 pr-4">Copy tên file</th>
                <th className="py-3 pr-4">Quyền tải</th>
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
                    onToggleDownload={toggleDownload}
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
  onToggleDownload,
  onToggleExpanded,
}: {
  gallery: AdminGallery;
  requests: AdminEditRequest[];
  isExpanded: boolean;
  copiedId: string;
  busyId: string;
  onCopy: (value: string, id: string) => void;
  onSync: (slug: string, id: string) => void;
  onToggleDownload: (gallery: AdminGallery) => void;
  onToggleExpanded: () => void;
}) {
  const requestFileNames = requests.map((request) => request.fileName).join(", ");

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
          <div className="flex flex-col gap-2">
            <LinkWithCopy
              label="FILE GỐC"
              value={gallery.customerUrl}
              copied={copiedId === `${gallery.id}-customer`}
              onCopy={() => onCopy(gallery.customerUrl, `${gallery.id}-customer`)}
            />
            <LinkWithCopy
              label="HOÀN THIỆN"
              value={gallery.customerDoneUrl}
              copied={copiedId === `${gallery.id}-customer-done`}
              onCopy={() => onCopy(gallery.customerDoneUrl, `${gallery.id}-customer-done`)}
            />
          </div>
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
            onClick={() => onCopy(requestFileNames, `${gallery.id}-request-files`)}
            disabled={requests.length === 0}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedId === `${gallery.id}-request-files` ? <Check size={14} /> : <Copy size={14} />}
            {copiedId === `${gallery.id}-request-files` ? "Đã copy" : "Copy tất cả"}
          </button>
        </td>
        <td className="py-4 pr-4">
          <div className="flex flex-col items-start gap-2">
            <DownloadPermissionButton
              enabled={gallery.rawDownloadEnabled && gallery.editedDownloadEnabled}
              loading={busyId === `download-${gallery.id}`}
              label="Tải file (gốc & hoàn thiện)"
              onClick={() => onToggleDownload(gallery)}
            />
          </div>
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
          <td colSpan={8} className="bg-zinc-50 px-4 py-4">
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

  const requestRows = chunkRequests(requests, 2);

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-white text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Tên file</th>
            <th className="px-4 py-3">Nội dung cần chỉnh sửa</th>
            <th className="px-4 py-3">Tên file</th>
            <th className="px-4 py-3">Nội dung cần chỉnh sửa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {requestRows.map((row) => (
            <tr key={row.map((request) => request.id).join("-")} className="align-top text-zinc-700">
              {row.map((request) => (
                <Fragment key={request.id}>
                  <td className="w-[18%] px-4 py-3 font-semibold text-zinc-950">{request.fileName}</td>
                  <td className="w-[32%] px-4 py-3">
                    <p className="whitespace-pre-wrap leading-6">{request.editNote?.trim() || "Khách chưa nhập ghi chú."}</p>
                  </td>
                </Fragment>
              ))}
              {row.length === 1 && (
                <>
                  <td className="w-[18%] px-4 py-3" />
                  <td className="w-[32%] px-4 py-3" />
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function chunkRequests(requests: AdminEditRequest[], size: number) {
  const rows: AdminEditRequest[][] = [];

  for (let index = 0; index < requests.length; index += size) {
    rows.push(requests.slice(index, index + size));
  }

  return rows;
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

function LinkWithCopy({ value, copied, onCopy, label }: { value: string; copied: boolean; onCopy: () => void; label?: string }) {
  return (
    <div className="grid max-w-[310px] grid-cols-[86px_minmax(0,1fr)_36px] items-center gap-2">
      {label && <span className="rounded bg-zinc-100 px-2 py-1 text-center text-[11px] font-bold text-zinc-800">{label}</span>}
      <a href={value} target="_blank" rel="noreferrer" className="truncate rounded-md border border-zinc-200 px-3 py-2 text-zinc-600 hover:text-zinc-950">
        {value}
      </a>
      <button type="button" onClick={onCopy} className="grid size-9 place-items-center rounded-md bg-zinc-950 text-white" aria-label="Copy link">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function DownloadPermissionButton({
  enabled,
  loading,
  label,
  onClick,
}: {
  enabled: boolean;
  loading: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 font-semibold ${
        enabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-700"
      }`}
    >
      {loading && <RefreshCw className="animate-spin" size={14} />}
      {label}: {enabled ? "Đang mở" : "Đang khóa"}
    </button>
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

type PaymentSettingsForm = {
  bank_bin: string;
  bank_name: string;
  account_number: string;
  account_name: string;
};

type VietQrBank = { id: number; name: string; code: string; bin: string; shortName: string; logo: string };

const emptyPaymentSettings: PaymentSettingsForm = { bank_bin: "", bank_name: "", account_number: "", account_name: "" };

function PaymentSettingsView() {
  const [form, setForm] = useState<PaymentSettingsForm>(emptyPaymentSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [banks, setBanks] = useState<VietQrBank[]>([]);

  useEffect(() => {
    fetch("/api/admin/payment-settings", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { settings?: PaymentSettingsForm | null; error?: string };
        if (!response.ok) throw new Error(payload.error || "Không đọc được cấu hình thanh toán.");
        setForm(payload.settings || emptyPaymentSettings);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Không đọc được cấu hình thanh toán."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/vietqr/banks", { cache: "force-cache" })
      .then(async (response) => {
        const payload = await response.json() as { banks?: VietQrBank[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Không tải được danh sách ngân hàng.");
        setBanks(payload.banks || []);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Không tải được danh sách ngân hàng."));
  }, []);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/payment-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json() as { settings?: PaymentSettingsForm; error?: string };
      if (!response.ok) throw new Error(payload.error || "Không lưu được cấu hình thanh toán.");
      setForm(payload.settings || form); setMessage("Đã lưu. QR trên trang đăng ký sẽ dùng tài khoản này.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được cấu hình thanh toán.");
    } finally { setSaving(false); }
  }

  return <div className="max-w-3xl space-y-5"><HeaderCard title="Cài đặt thanh toán" description="Thông tin này được dùng để tạo mã VietQR động ở trang đăng ký TLORA Studio Platform." action="VietQR Banking" /><form onSubmit={saveSettings} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3 rounded-md border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900"><Landmark className="mt-0.5 shrink-0" size={18} /><p>Chọn ngân hàng Việt Nam để tự điền tên và BIN. API key VietQR được bảo mật trong biến môi trường máy chủ, không nhập tại đây.</p></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-zinc-800 sm:col-span-2">Ngân hàng Việt Nam *<select value={form.bank_bin} onChange={(event) => { const bank = banks.find((item) => item.bin === event.target.value); if (bank) setForm((current) => ({ ...current, bank_bin: bank.bin, bank_name: bank.name })); }} disabled={loading || banks.length === 0} required className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100"><option value="">{banks.length ? "Chọn ngân hàng nhận tiền" : "Đang tải danh sách ngân hàng..."}</option>{banks.map((bank) => <option key={bank.id} value={bank.bin}>{bank.shortName} — {bank.bin}</option>)}</select></label><PaymentInput label="Tên ngân hàng *" placeholder="Tự động điền sau khi chọn" value={form.bank_name} onChange={(value) => setForm((current) => ({ ...current, bank_name: value }))} disabled={loading} /><PaymentInput label="Mã BIN ngân hàng *" placeholder="Tự động điền sau khi chọn" value={form.bank_bin} onChange={(value) => setForm((current) => ({ ...current, bank_bin: value.replace(/\D/g, "") }))} disabled={loading} inputMode="numeric" /><PaymentInput label="Số tài khoản *" placeholder="0123456789" value={form.account_number} onChange={(value) => setForm((current) => ({ ...current, account_number: value.replace(/\s/g, "") }))} disabled={loading} inputMode="numeric" /><PaymentInput label="Tên chủ tài khoản *" placeholder="NGUYEN VAN A" value={form.account_name} onChange={(value) => setForm((current) => ({ ...current, account_name: value.toUpperCase() }))} disabled={loading} /></div>{message && <p className={`mt-5 rounded-md p-3 text-sm font-medium ${message.startsWith("Đã lưu") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}<button type="submit" disabled={loading || saving} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{saving ? "Đang lưu..." : "Lưu thông tin nhận tiền"}</button></form></div>;
}

function PaymentInput({ label, placeholder, value, onChange, disabled, inputMode }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; disabled: boolean; inputMode?: "numeric" }) {
  return <label className="block text-sm font-semibold text-zinc-800">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} required inputMode={inputMode} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100" /></label>;
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
  if (item === "Cài đặt") return "payment-settings";
  if (item === "Tin tức") return "news";
  if (item === "Build UI / UX") return "site-builder";
  if (item === "Quản lý album khách hàng") return "album-manager";
  if (item === "Ảnh cần sửa") return "edit-requests";
  return "placeholder";
}

function getMenuIcon(item: string) {
  if (item === "Dashboard") return <BarChart3 size={17} />;
  if (item === "Quản lý album khách hàng") return <LinkIcon size={17} />;
  if (item === "Ảnh cần sửa") return <ImageUp size={17} />;
  if (item === "Cài đặt") return <Settings size={17} />;
  if (item === "Build UI / UX") return <Sparkles size={17} />;
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
