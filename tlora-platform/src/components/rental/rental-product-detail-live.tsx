"use client";

import { Check, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRentalCart } from "@/lib/rental/cart";
import { formatRentalMoney, type RentalProduct } from "@/lib/rental/catalog";

type AvailabilityResponse = { sizes?: Record<string, boolean>; updatedAt?: string };

export function RentalProductDetailLive({ product }: { product: RentalProduct }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [availability, setAvailability] = useState<Record<string, boolean>>(
    () => Object.fromEntries(product.sizes.map((size) => [size, product.status === "available"])),
  );
  const [size, setSize] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [added, setAdded] = useState(false);
  const { add } = useRentalCart();
  const availableSizes = useMemo(() => product.sizes.filter((value) => availability[value]), [availability, product.sizes]);
  const selectedAvailable = Boolean(size && availability[size]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/api/rental/availability/${encodeURIComponent(product.id)}`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as AvailabilityResponse;
        if (!active || !result.sizes) return;
        setAvailability(result.sizes);
        setUpdatedAt(result.updatedAt || "");
        setSize((current) => current && result.sizes?.[current] ? current : "");
      } catch {
        // Preserve the latest known state during a temporary connection failure.
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [product.id]);

  function addItem() {
    if (!selectedAvailable) return;
    add({ productId: product.id, size, color: product.color, quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1_800);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,.65fr)]">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-[#15171c]">
            <Image src={product.images[imageIndex]} alt={`${product.name} ${imageIndex + 1}`} fill priority sizes="(min-width:1024px) 62vw, 100vw" className="object-cover" />
            {product.images.length > 1 && <>
              <button onClick={() => setImageIndex((imageIndex - 1 + product.images.length) % product.images.length)} aria-label="Ảnh trước" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur"><ChevronLeft /></button>
              <button onClick={() => setImageIndex((imageIndex + 1) % product.images.length)} aria-label="Ảnh sau" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur"><ChevronRight /></button>
            </>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {product.images.map((image, index) => <button key={image} onClick={() => setImageIndex(index)} className={`relative aspect-square overflow-hidden border ${index === imageIndex ? "border-[#d8b766]" : "border-transparent"}`}><Image src={image} alt="" fill sizes="180px" className="object-cover" /></button>)}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[.14em] text-white/45">{product.category}</p>
            <span className={`inline-flex items-center gap-2 text-xs ${availableSizes.length ? "text-emerald-300" : "text-white/45"}`}><i className={`size-2 rounded-full ${availableSizes.length ? "bg-emerald-400" : "bg-white/35"}`} />{availableSizes.length ? "Có sẵn" : "Không có sẵn"}</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-[-.04em] sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold text-[#f3d88e]">{formatRentalMoney(product.price)} <small className="text-xs font-normal text-white/40">/ ngày</small></p>
          <p className="mt-6 text-sm leading-7 text-white/58">{product.description}</p>
          <div className="mt-8 border-t border-white/10 pt-6"><p className="text-xs font-bold uppercase tracking-[.12em]">Màu sắc</p><div className="mt-3 flex items-center gap-3 text-sm text-white/60"><i className="size-5 rounded-full border border-white/20" style={{ background: product.colorHex }} />{product.color}</div></div>

          <div className="mt-6">
            <div className="flex items-end justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.12em]">Chọn size</p><p className="text-[10px] text-white/35">{updatedAt ? "Tự cập nhật mỗi 5 giây" : "Đang kiểm tra…"}</p></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((value) => {
                const available = Boolean(availability[value]);
                return <button key={value} disabled={!available} onClick={() => setSize(value)} title={available ? `Size ${value} có sẵn` : `Size ${value} không có sẵn`} className={`min-h-11 min-w-11 border px-3 text-sm ${size === value ? "border-[#d8b766] bg-[#d8b766]/10 text-[#f3d88e]" : "border-white/15"} disabled:cursor-not-allowed disabled:border-white/5 disabled:text-white/20 disabled:line-through`}>{value}</button>;
              })}
            </div>
            {!availableSizes.length && <p className="mt-3 text-sm leading-6 text-white/45">Sản phẩm hiện chưa có size nào sẵn sàng cho thuê. Tình trạng sẽ tự cập nhật khi nhân viên thay đổi.</p>}
          </div>

          {selectedAvailable
            ? <button onClick={addItem} className="mt-8 inline-flex min-h-13 w-full items-center justify-center gap-2 bg-[#f8f5ee] px-5 text-sm font-bold text-black">{added ? <><Check size={18} />Đã thêm</> : <><ShoppingBag size={18} />Thêm vào giỏ</>}</button>
            : <p className="mt-8 border border-white/10 px-5 py-4 text-center text-sm text-white/45">{availableSizes.length ? "Chọn một size có sẵn để đặt thuê" : "Không có sẵn để đặt thuê"}</p>}
        </aside>
      </div>
    </div>
  );
}
