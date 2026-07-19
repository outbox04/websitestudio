import Image from "next/image";
import Link from "next/link";
import { formatRentalMoney, rentalStatusMeta, type RentalProduct } from "@/lib/rental/catalog";

export function RentalProductCard({ product, priority = false }: { product: RentalProduct; priority?: boolean }) {
  const status = rentalStatusMeta[product.status];
  return <article className="group min-w-0"><Link href={`/thue-trang-phuc/${product.slug}`} className="block"><div className="relative aspect-[3/4] overflow-hidden bg-[#15171c]"><Image src={product.images[0]} alt={product.name} fill priority={priority} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]" /><span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-white backdrop-blur-md"><i className="size-1.5 rounded-full" style={{ background: status.dot }} />{status.label}</span></div><div className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-white">{product.name}</h3><p className="mt-1 text-xs text-white/45">{product.category} · {product.color}</p></div><p className="shrink-0 text-sm font-semibold text-[#f3d88e]">Từ {formatRentalMoney(product.price)}</p></div></Link></article>;
}
