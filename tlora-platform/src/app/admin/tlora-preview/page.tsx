import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TloraCmsEditor } from "@/components/tlora-cms/tlora-cms-editor";
import { AuthorizationError, requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraCmsPage, listTloraCmsPages } from "@/repositories/tlora/cms-repository";
import { listTloraMedia } from "@/repositories/tlora/media-repository";

export const metadata: Metadata = {
  title: "Trình chỉnh sửa website TLORA",
  description: "Chỉnh sửa trực tiếp nội dung và metadata của website TLORA.",
};
export const dynamic = "force-dynamic";

async function loadPreview() {
  try {
    const context = await requireTloraAdmin();
    const [data, pages, media] = await Promise.all([
      getTloraCmsPage(context.studio.id, "home"),
      listTloraCmsPages(context.studio.id),
      listTloraMedia(context.studio.id),
    ]);
    return { context, data, pages, media };
  } catch (error) {
    if (error instanceof AuthorizationError) redirect(error.status === 401 ? "/dang-nhap?redirect=/admin/tlora-preview" : "/");
    throw error;
  }
}

export default async function TloraPreviewPage() {
  const { context, data, pages, media } = await loadPreview();
  return <TloraCmsEditor studioName={context.studio.displayName} initialPage={data.page} initialPages={pages} initialSections={data.sections} initialMedia={media} />;
}
