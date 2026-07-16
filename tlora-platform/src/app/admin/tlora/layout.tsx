import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TloraCmsNavigation } from "@/components/tlora-cms/tlora-cms-navigation";
import { AuthorizationError, requireTloraAdmin } from "@/lib/tenancy/request-context";

async function authorize() {
  try {
    return await requireTloraAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect(error.status === 401 ? "/dang-nhap?redirect=/admin/tlora" : "/");
    throw error;
  }
}

export default async function TloraCmsLayout({ children }: { children: ReactNode }) {
  const context = await authorize();
  return (
    <div className="min-h-screen bg-[#07080a] text-[#f8f5ee] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-[#2a2722] bg-[#101115] p-4 lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="px-2">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">Website CMS</p>
          <p className="mt-2 text-lg font-extrabold">{context.studio.displayName}</p>
          <p className="mt-1 text-xs text-[#8c8174]">{context.isPlatformAdmin ? "Quản trị hệ thống" : "Biên tập nội dung"}</p>
        </div>
        <TloraCmsNavigation />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
