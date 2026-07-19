import type { Metadata } from "next";
import { RentalCatalog } from "@/components/rental/rental-catalog";
export const metadata: Metadata = { title: "Danh sách trang phục | TLORA Rental" };
export default function RentalProductsPage() { return <><header className="border-b border-white/10 px-4 pb-10 pt-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px]"><p className="text-xs uppercase tracking-[.18em] text-[#f3d88e]">TLORA Rental</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Trang phục</h1></div></header><RentalCatalog /></>; }
