import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ThemeContentEditor } from "@/components/admin/theme-content-editor";
import { getStudioAdminContext } from "@/lib/studio-admin";

const pages: Record<string, string> = { "trang-chu": "Trang chủ", "gioi-thieu": "Giới thiệu", "dich-vu": "Dịch vụ", album: "Album", "bang-gia": "Bảng giá", "lien-he": "Liên hệ" };

export const dynamic = "force-dynamic";

export default async function BuildUiPage({ params }: { params: Promise<{ studioSlug: string; page: string }> }) {
  const { studioSlug, page } = await params;
  if (!pages[page]) notFound();
  const context = await getStudioAdminContext(studioSlug);
  if (!context) redirect("/dang-nhap?redirect=/quan-tri/build-ui/" + page);
  return <main className="min-h-screen bg-[#f4f6f8] p-4 text-zinc-950 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#c99a5e]">Build UI / UX</p><h1 className="mt-1 text-3xl font-extrabold">Chỉnh sửa trang {pages[page]}</h1></div><Link href="/quan-tri" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-bold">← Quay lại quản trị</Link></div><nav className="mb-5 flex flex-wrap gap-2">{Object.entries(pages).map(([slug, label]) => <Link key={slug} href={`/quan-tri/build-ui/${slug}`} className={`rounded-full px-4 py-2 text-sm font-bold ${slug === page ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"}`}>{label}</Link>)}</nav><ThemeContentEditor saved={context.settings?.site_content} /></div></main>;
}
