import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TloraCmsEditor } from "@/components/tlora-cms/tlora-cms-editor";
import { AuthorizationError, requireTloraAdmin } from "@/lib/tenancy/request-context";
import { getTloraCmsPage } from "@/repositories/tlora/cms-repository";

export const metadata: Metadata = {
  title: "TLORA First-party CMS",
  description: "Quản trị nội dung chính thức của website TLORA.",
};

export const dynamic = "force-dynamic";

async function loadCmsPage() {
  try {
    const context = await requireTloraAdmin();
    const data = await getTloraCmsPage(context.studio.id, "home");
    return { context, data };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect(error.status === 401 ? "/dang-nhap?redirect=/admin/tlora" : "/");
    }
    throw error;
  }
}

export default async function TloraCmsPage() {
  const { context, data } = await loadCmsPage();
  return <TloraCmsEditor studioName={context.studio.displayName} initialPage={data.page} initialSections={data.sections} />;
}
