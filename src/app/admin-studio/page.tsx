import type { Metadata } from "next";
import { BarChart3, FolderSync, ImageUp, Newspaper, Settings, Users, type LucideIcon } from "lucide-react";
import { CustomerGalleryCreator } from "@/components/admin/customer-gallery-creator";
import { adminMenu } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Admin Studio",
  description: "Dashboard quản lý khách hàng, album, ảnh cần sửa, tin tức và AI workflow.",
};

const stats: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Khách hàng", value: "128", icon: Users },
  { label: "Album đang xử lý", value: "36", icon: FolderSync },
  { label: "Ảnh cần sửa", value: "412", icon: ImageUp },
  { label: "Bài viết", value: "24", icon: Newspaper },
];

export default function AdminStudioPage() {
  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-zinc-200 bg-white p-4 lg:min-h-screen">
          <div className="flex items-center gap-3 px-2 py-3">
            <span className="grid size-10 place-items-center rounded-md bg-zinc-950 text-white"><BarChart3 size={20} /></span>
            <div>
              <p className="font-heading font-bold">Admin Studio</p>
              <p className="text-xs text-zinc-500">Management Console</p>
            </div>
          </div>
          <nav className="mt-5 space-y-1">
            {adminMenu.map((item, index) => (
              <a key={item} href={`#${item}`} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold ${index === 0 ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
                {item === "Cài đặt" ? <Settings size={17} /> : <span className="size-2 rounded-full bg-current" />}
                {item}
              </a>
            ))}
          </nav>
        </aside>
        <section className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold">Dashboard</h1>
              <p className="mt-2 text-sm text-zinc-600">Chỉ `admin` và `staff` truy cập được qua middleware Supabase.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
                <Icon className="text-rose-600" size={24} />
                <p className="mt-4 text-sm font-semibold text-zinc-500">{label}</p>
                <p className="mt-1 text-3xl font-extrabold">{value}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <CustomerGalleryCreator />
            <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Quy trình TLORA</h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-600">
                <p>1. Tạo thư mục khách hàng trong thư mục gốc TLORA.</p>
                <p>2. Upload ảnh vào link FILE GỐC, sau đó bấm đồng bộ ảnh.</p>
                <p>3. Gửi link khách hàng dạng `/ten-khach` để khách chọn ảnh và nhập ghi chú.</p>
                <p>4. Chỉ mở tải FILE GỐC khi khách đã thanh toán đủ.</p>
                <p>5. Upload ảnh hoàn thiện vào FILE CHỈNH SỬA để khách tải ở tab cuối.</p>
              </div>
            </section>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Ảnh khách đã chọn</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-zinc-200 text-zinc-500">
                    <tr><th className="py-3">Khách</th><th>Album</th><th>Ảnh</th><th>Ghi chú</th><th>Trạng thái</th></tr>
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
            <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Cài đặt Google Drive</h2>
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
