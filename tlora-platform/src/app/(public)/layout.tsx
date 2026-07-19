import type { ReactNode } from "react";
import { unstable_cache } from "next/cache";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { TloraPublicPreviewLoader } from "@/components/tlora-cms/tlora-public-preview-loader";
import { getFirstPartyStudio } from "@/lib/tenancy/request-context";
import { tloraPublicCacheTags } from "@/lib/tlora-public-cache";
import { getTloraMenu } from "@/repositories/tlora/menus-repository";
import { getPublishedTloraSiteSettings } from "@/repositories/tlora/settings-repository";
import { RENTAL_ENABLED, RENTAL_MENU_ITEM } from "@/lib/rental/config";

export const revalidate = 300;

const readPublishedShell = unstable_cache(async () => {
  const studio = await getFirstPartyStudio();
  if (!studio) return {};
  const [menu, publishedContact] = await Promise.all([getTloraMenu(studio.id), getPublishedTloraSiteSettings(studio.id)]);
  const items = menu.items.filter((item) => item.isEnabled).map((item) => ({ href: item.href, label: item.label }));
  const legacySettings = studio.settings || {};
  const legacyValue = (key: string) => typeof legacySettings[key] === "string" ? legacySettings[key].trim() : "";
  const contact = {
    ...publishedContact,
    phone: publishedContact.phone.trim() || legacyValue("phone"),
    email: publishedContact.email.trim() || legacyValue("email"),
    address: publishedContact.address.trim() || legacyValue("address"),
    facebookUrl: publishedContact.facebookUrl.trim() || legacyValue("facebook_url"),
    zalo: publishedContact.zalo.trim() || legacyValue("zalo_phone"),
    googleMapsEmbed: publishedContact.googleMapsEmbed?.trim() || "",
  };
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
  const visibleNavItems = RENTAL_ENABLED && navItems
    ? navItems.some((item) => item.href === RENTAL_MENU_ITEM.href)
      ? navItems
      : [...navItems.slice(0, Math.max(0, navItems.findIndex((item) => item.href === "/bang-gia") + 1)), RENTAL_MENU_ITEM, ...navItems.slice(Math.max(0, navItems.findIndex((item) => item.href === "/bang-gia") + 1))]
    : navItems;
  return (
    <>
      <TloraPublicPreviewLoader />
      <SiteHeader navItems={visibleNavItems} contact={contact} rentalEnabled={RENTAL_ENABLED} />
      <main>{children}</main>
      <SiteFooter contact={contact} />
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
