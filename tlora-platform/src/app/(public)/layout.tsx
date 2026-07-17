import type { ReactNode } from "react";
import { unstable_cache } from "next/cache";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { TloraPublicPreviewBridge } from "@/components/tlora-cms/tlora-public-preview-bridge";
import { getFirstPartyStudio } from "@/lib/tenancy/request-context";
import { tloraPublicCacheTags } from "@/lib/tlora-public-cache";
import { getTloraMenu } from "@/repositories/tlora/menus-repository";
import { getPublishedTloraSiteSettings } from "@/repositories/tlora/settings-repository";

export const dynamic = "force-dynamic";

const readPublishedShell = unstable_cache(async () => {
  const studio = await getFirstPartyStudio();
  if (!studio) return {};
  const [menu, contact] = await Promise.all([getTloraMenu(studio.id), getPublishedTloraSiteSettings(studio.id)]);
  const items = menu.items.filter((item) => item.isEnabled).map((item) => ({ href: item.href, label: item.label }));
  return { navItems: items.length ? items : undefined, contact };
}, ["tlora-published-shell"], {
  revalidate: 300,
  tags: [tloraPublicCacheTags.shell],
});

async function getPublishedShell() {
  try {
    return await readPublishedShell();
  } catch {
    return {};
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { navItems, contact } = await getPublishedShell();
  return (
    <>
      <TloraPublicPreviewBridge />
      <SiteHeader navItems={navItems} contact={contact} />
      <main>{children}</main>
      <SiteFooter contact={contact} />
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
