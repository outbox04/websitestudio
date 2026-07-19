import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { RENTAL_ENABLED } from "@/lib/rental/config";

export default function RentalLayout({ children }: { children: ReactNode }) {
  if (!RENTAL_ENABLED) notFound();
  return <div className="rental-module bg-[#080a0f] text-[#f8f5ee]">{children}</div>;
}
