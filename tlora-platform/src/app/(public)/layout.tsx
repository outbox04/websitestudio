import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { TloraPublicPreviewBridge } from "@/components/tlora-cms/tlora-public-preview-bridge";
import { getFirstPartyStudio } from "@/lib/tenancy/request-context";
import { getTloraMenu } from "@/repositories/tlora/menus-repository";
import { getPublishedTloraSiteSettings } from "@/repositories/tlora/settings-repository";

export const dynamic = "force-dynamic";

async function getPublishedShell() {
  try {
    const studio = await getFirstPartyStudio();
    if (!studio) return {};
    const [menu, contact] = await Promise.all([getTloraMenu(studio.id), getPublishedTloraSiteSettings(studio.id)]);
    const items = menu.items.filter((item) => item.isEnabled).map((item) => ({ href: item.href, label: item.label }));
    return { navItems: items.length ? items : undefined, contact };
  } catch {
    return {};
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { navItems, contact } = await getPublishedShell();
  return (
    <>
      <TloraPublicPreviewBridge />
      <SiteHeader navItems={navItems} />
      <main>{children}</main>
      <SiteFooter contact={contact} />
    </>
  );
}
