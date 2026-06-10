import type { Metadata } from "next";
import {
  BarChart3,
  FolderSync,
  ImageUp,
  Newspaper,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CustomerGalleryCreator } from "@/components/admin/customer-gallery-creator";
import { CustomerGalleryManager } from "@/components/admin/customer-gallery-manager";
import { adminMenu } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Admin Studio",
  description: "Dashboard quản lý khách hàng, album, ảnh cần sửa, tin tức và AI workflow.",
};

const stats: { label: string; value: string; helper: string; icon: LucideIcon; tone: string }[] = [
  { label: "Khách hàng", value: "128", helper: "Tổng hồ sơ", icon: Users, tone: "bg-sky-50 text-sky-700 ring-sky-100" },
  { label: "Album đang xử lý", value: "36", helper: "Đang mở workflow", icon: FolderSync, tone: "bg-violet-50 text-violet-700 ring-violet-100" },
  { label: "Ảnh cần sửa", value: "412", helper: "Có ghi chú từ khách", icon: ImageUp, tone: "bg-amber-50 text-amber-700 ring-amber-100" },
  { label: "Bài viết", value: "24", helper: "Nội dung đã xuất bản", icon: Newspaper, tone: "bg-rose-50 text-rose-700 ring-rose-100" },
];

const workflow = [
  "Tạo thư mục khách hàng trong thư mục gốc TLORA.",
  "Upload ảnh vào link FILE GỐC, sau đó bấm đồng bộ ảnh.",
  "Gửi link khách hàng dạng /ten-khach để khách chọn ảnh và nhập ghi chú.",
  "Chỉ mở tải FILE GỐC khi khách đã thanh toán đủ.",
  "Upload ảnh hoàn thiện vào FILE CHỈNH SỬA để khách tải ở tab cuối.",
];

function adminMenuHref(item: string) {
  if (item === "Quản lý album khách hàng") {
    return "#quan-ly-album-khach-hang";
  }

  return `#${item}`;
}

export default function AdminStudioPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-zinc-950">
      <div className="grid lg:grid-cols-[288px_1fr]">
        <aside className="border-r border-zinc-200/80 bg-white px-4 py-5 lg:sticky lg:top-0 lg:min-h-screen">
          <div className="flex items-center gap-3 rounded-md bg-zinc-950 p-3 text-white">
            <span className="grid size-11 place-items-center rounded-md bg-white/10">
              <BarChart3 size={21} />
            </span>
            <div>
              <p className="font-heading text-base font-bold">Admin Studio</p>
              <p className="text-xs text-zinc-300">Management Console</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {adminMenu.map((item, index) => (
              <a
                key={item}
                href={adminMenuHref(item)}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                  index === 0
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {item === "Cài đặt" ? <Settings size={17} /> : <span className="size-2 rounded-full bg-current" />}
                <span className="truncate">{item}</span>
              </a>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                  <ShieldCheck size={14} />
                  Admin và staff
                </p>
                <h1 className="mt-4 text-3xl font-extrabold tracking-normal text-zinc-950 md:text-4xl">Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                  Quản lý album khách hàng, link gửi khách, quyền tải file và quy trình đồng bộ Google Drive.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
                <FolderSync size={18} className="text-zinc-500" />
                <span>Google Drive workflow</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, helper, icon: Icon, tone }) => (
              <article key={label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-600">{label}</p>
                    <p className="mt-3 text-3xl font-extrabold text-zinc-950">{value}</p>
                    <p className="mt-2 text-xs font-medium text-zinc-500">{helper}</p>
                  </div>
                  <span className={`grid size-11 shrink-0 place-items-center rounded-md ring-1 ${tone}`}>
                    <Icon size={20} />
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <CustomerGalleryCreator />
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950">Quy trình TLORA</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">Checklist vận hành album từ lúc tạo thư mục đến khi giao file.</p>
                </div>
                <span className="grid size-10 place-items-center rounded-md bg-zinc-950 text-white">
                  <FolderSync size={18} />
                </span>
              </div>
              <ol className="mt-5 space-y-3">
                {workflow.map((item, index) => (
                  <li key={item} className="grid grid-cols-[32px_1fr] gap-3 text-sm leading-6 text-zinc-700">
                    <span className="grid size-8 place-items-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="mt-5">
            <CustomerGalleryManager />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-950">Ảnh khách đã chọn</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="py-3 pr-4">Khách</th>
                      <th className="pr-4">Album</th>
                      <th className="pr-4">Ảnh</th>
                      <th className="pr-4">Ghi chú</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {[
                      ["Minh Anh", "Concept Beauty", "DRV_002", "Da tự nhiên, sáng mắt", "Đang chỉnh"],
                      ["Gia Hân", "Profile 2026", "DRV_014", "Crop ngang LinkedIn", "Đã chọn"],
                      ["An Studio", "Lookbook Summer", "DRV_088", "Xóa nếp áo", "Đã hoàn thành"],
                    ].map((row) => (
                      <tr key={row[2]} className="text-zinc-700">
                        {row.map((cell) => <td key={cell} className="py-4 pr-4">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-950">Cài đặt Google Drive</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Cần service account có quyền ghi vào thư mục gốc TLORA và biến `TLORA_DRIVE_ROOT_FOLDER_ID`.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
