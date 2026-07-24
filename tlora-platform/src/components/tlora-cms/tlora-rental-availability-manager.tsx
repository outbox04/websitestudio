"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { rentalProducts } from "@/lib/rental/catalog";

type Availability = Record<string, Record<string, boolean>>;

export function TloraRentalAvailabilityManager() {
  const [availability, setAvailability] = useState<Availability>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setBusy("refresh");
    const entries = await Promise.all(rentalProducts.map(async (product) => {
      const response = await fetch(`/api/rental/availability/${product.id}`, { cache: "no-store" });
      const result = await response.json() as { sizes?: Record<string, boolean> };
      return [product.id, result.sizes || {}] as const;
    }));
    setAvailability(Object.fromEntries(entries));
    setBusy("");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function toggle(productId: string, size: string) {
    const next = !availability[productId]?.[size];
    const key = `${productId}:${size}`;
    setBusy(key);
    setMessage("");
    const response = await fetch("/api/admin/tlora/rental-availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, size, isAvailable: next }),
    });
    if (response.ok) {
      setAvailability((current) => ({ ...current, [productId]: { ...current[productId], [size]: next } }));
      setMessage("Đã cập nhật. Khách hàng sẽ thấy trạng thái mới trong tối đa 5 giây.");
    } else {
      const result = await response.json() as { error?: string };
      setMessage(result.error || "Không thể cập nhật tình trạng.");
    }
    setBusy("");
  }

  return (
    <main className="p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#d8b766]">TLORA Rental</p><h1 className="mt-2 text-3xl font-extrabold">Tình trạng trang phục</h1><p className="mt-2 text-sm text-[#8c8174]">Bật “Có sẵn” theo từng size. Khách hàng chỉ thấy Có sẵn hoặc Không có sẵn.</p></div>
        <button type="button" onClick={() => void refresh()} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold"><RefreshCw size={16} />Tải lại</button>
      </div>
      {message && <p className="mt-5 rounded-md border border-white/10 bg-white/[.04] p-3 text-sm text-[#cbc0b0]">{message}</p>}
      <div className="mt-6 divide-y divide-white/10 rounded-lg border border-white/10">
        {rentalProducts.map((product) => <section key={product.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div><h2 className="font-bold">{product.name}</h2><p className="mt-1 text-xs text-[#8c8174]">{product.category} · {product.color}</p></div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const key = `${product.id}:${size}`;
              const available = Boolean(availability[product.id]?.[size]);
              return <button key={size} type="button" disabled={Boolean(busy)} onClick={() => void toggle(product.id, size)} className={`inline-flex min-h-10 min-w-24 items-center justify-center gap-2 rounded-md border px-3 text-xs font-bold ${available ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-[#8c8174]"}`}>{busy === key && <Loader2 className="animate-spin" size={13} />}Size {size} · {available ? "Có sẵn" : "Không có"}</button>;
            })}
          </div>
        </section>)}
      </div>
    </main>
  );
}
