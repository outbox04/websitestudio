import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const adminFont = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={adminFont.className}>{children}</div>;
}
