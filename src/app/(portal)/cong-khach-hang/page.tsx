import type { Metadata } from "next";
import { AlbumGallery } from "@/components/album-gallery";

export const metadata: Metadata = {
  title: "Cổng khách hàng",
  description: "Xem album cá nhân, chọn ảnh chỉnh sửa và ghi chú từng ảnh.",
};

export default function CustomerPortalPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">Cổng khách hàng</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">Album ảnh cá nhân</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Ảnh được đồng bộ từ Google Drive Folder, chọn ảnh cần chỉnh và gửi ghi chú ngay dưới từng ảnh.</p>
        </div>
      </div>
      <AlbumGallery />
    </main>
  );
}
