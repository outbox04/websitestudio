"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRentalCart } from "@/lib/rental/cart";

export function RentalCartButton() {
  const { count } = useRentalCart();
  return <Link href="/thue-trang-phuc/gio-hang" aria-label={`Giỏ thuê trang phục, ${count} sản phẩm`} className="relative grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-white transition hover:border-[#d8b766] hover:text-[#f3d88e]"><ShoppingBag size={18} aria-hidden="true" />{count > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#d8b766] px-1 text-[10px] font-black text-[#07080a]">{count}</span>}</Link>;
}
