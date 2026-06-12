import type { Metadata } from "next";
import { FolderSync, Settings, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { AdminStudioTabs, type AdminEditRequest, type AdminGallery } from "@/components/admin/admin-studio-tabs";
import { adminMenu } from "@/lib/site-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "TLORA Admin",
  description: "Dashboard quản lý khách hàng, album, ảnh cần sửa, tin tức và AI workflow.",
};

export const dynamic = "force-dynamic";

type CustomerGalleryRow = {
  id: string;
  customer_name: string;
  customer_name_slug: string;
  shoot_date: string;
  raw_drive_folder_url: string;
  edited_drive_folder_url: string;
  raw_download_enabled: boolean;
};

type CustomerGalleryPhotoRow = {
  id: string;
  gallery_id: string;
  file_name: string;
  preview_url: string | null;
  download_url: string | null;
  kind: "raw" | "edited";
  selected: boolean;
  edit_note: string | null;
  updated_at: string;
};

function adminMenuHref(item: string) {
  if (item === "Quản lý album khách hàng") {
    return "#quan-ly-album-khach-hang";
  }

  return `#${item}`;
}

async function getAdminGalleryData(): Promise<{
  galleries: AdminGallery[];
  editRequests: AdminEditRequest[];
  databaseError?: string;
}> {
  try {
    const supabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const [{ data: galleriesData, error: galleriesError }, { data: photosData, error: photosError }] = await Promise.all([
      supabase
        .from("customer_galleries")
        .select("id,customer_name,customer_name_slug,shoot_date,raw_drive_folder_url,edited_drive_folder_url,raw_download_enabled")
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_gallery_photos")
        .select("id,gallery_id,file_name,preview_url,download_url,kind,selected,edit_note,updated_at")
        .eq("kind", "raw")
        .order("updated_at", { ascending: false }),
    ]);

    if (galleriesError) {
      throw galleriesError;
    }

    if (photosError) {
      throw photosError;
    }

    const galleriesRows = (galleriesData || []) as CustomerGalleryRow[];
    const photosRows = (photosData || []) as CustomerGalleryPhotoRow[];
    const galleryById = new Map(galleriesRows.map((gallery) => [gallery.id, gallery]));

    const galleries = galleriesRows.map((gallery) => {
      const rawPhotos = photosRows.filter((photo) => photo.gallery_id === gallery.id);
      const selectedPhotos = rawPhotos.filter((photo) => photo.selected);

      return {
        id: gallery.id,
        customerName: gallery.customer_name,
        customerSlug: gallery.customer_name_slug,
        shootDate: gallery.shoot_date,
        customerUrl: `${siteUrl.replace(/\/$/, "")}/${gallery.customer_name_slug}`,
        rawDriveUrl: gallery.raw_drive_folder_url,
        editedDriveUrl: gallery.edited_drive_folder_url,
        rawDownloadEnabled: gallery.raw_download_enabled,
        rawPhotoCount: rawPhotos.length,
        selectedPhotoCount: selectedPhotos.length,
      };
    });

    const editRequests = photosRows
      .filter((photo) => photo.selected || Boolean(photo.edit_note?.trim()))
      .map((photo) => {
        const gallery = galleryById.get(photo.gallery_id);

        if (!gallery) {
          return null;
        }

        return {
          id: photo.id,
          galleryId: photo.gallery_id,
          customerName: gallery.customer_name,
          customerSlug: gallery.customer_name_slug,
          shootDate: gallery.shoot_date,
          customerUrl: `${siteUrl.replace(/\/$/, "")}/${gallery.customer_name_slug}`,
          fileName: photo.file_name,
          editNote: photo.edit_note,
          previewUrl: photo.preview_url,
          downloadUrl: photo.download_url,
          updatedAt: photo.updated_at,
          selected: photo.selected,
        };
      })
      .filter((request): request is AdminEditRequest => Boolean(request));

    return { galleries, editRequests };
  } catch (error) {
    return {
      galleries: [],
      editRequests: [],
      databaseError: error instanceof Error ? error.message : "Không đọc được dữ liệu Supabase",
    };
  }
}

export default async function AdminStudioPage() {
  const { galleries, editRequests, databaseError } = await getAdminGalleryData();

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
                  Quản lý album khách hàng, link gửi khách, quyền tải file và bảng tổng hợp ảnh cần chỉnh.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
                <FolderSync size={18} className="text-zinc-500" />
                <span>Google Drive workflow</span>
              </div>
            </div>
          </div>

          <div id="quan-ly-album-khach-hang" className="mt-5">
            <AdminStudioTabs galleries={galleries} editRequests={editRequests} databaseError={databaseError} />
          </div>
        </section>
      </div>
    </main>
  );
}
