import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
