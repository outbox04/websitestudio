"use client";

import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { cmsMenuSchema } from "@/schemas/tlora-cms";
import type { TloraCmsMenu } from "@/types/scope";

export function TloraMenuManager({ initialMenu }: { initialMenu: TloraCmsMenu }) {
  const [menu, setMenu] = useState(initialMenu);
  const [message, setMessage] = useState("");

  async function save() {
    const normalized = menu.items.map((item, index) => ({ ...item, sortOrder: index * 10 }));
    const parsed = cmsMenuSchema.safeParse({ menuId: menu.id, items: normalized });
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Menu không hợp lệ.");
    const response = await fetch("/api/admin/tlora/menus", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const result = await response.json() as { menu?: TloraCmsMenu; error?: string };
    if (!response.ok || !result.menu) return setMessage(result.error || "Không thể lưu menu.");
    setMenu(result.menu);
    setMessage("Đã lưu menu TLORA.");
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Navigation</p><h1 className="mt-2 text-3xl font-extrabold">{menu.name}</h1><p className="mt-2 text-sm text-zinc-600">Chỉ cho phép đường dẫn nội bộ, anchor hoặc URL HTTP(S).</p>
      <section className="mt-6 max-w-4xl rounded-xl border border-zinc-200 bg-white p-5">
        <div className="space-y-3">
          {menu.items.map((item, index) => <div key={item.id || `new-${index}`} className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[24px_1fr_1.2fr_auto_auto] sm:items-center"><GripVertical size={17} className="text-zinc-400" /><input value={item.label} onChange={(event) => setMenu((current) => ({ ...current, items: current.items.map((value, itemIndex) => itemIndex === index ? { ...value, label: event.target.value } : value) }))} placeholder="Nhãn" className="min-h-10 rounded-md border border-zinc-300 px-3 text-sm" /><input value={item.href} onChange={(event) => setMenu((current) => ({ ...current, items: current.items.map((value, itemIndex) => itemIndex === index ? { ...value, href: event.target.value } : value) }))} placeholder="/dich-vu" className="min-h-10 rounded-md border border-zinc-300 px-3 text-sm" /><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={item.isEnabled} onChange={(event) => setMenu((current) => ({ ...current, items: current.items.map((value, itemIndex) => itemIndex === index ? { ...value, isEnabled: event.target.checked } : value) }))} /> Hiện</label><button type="button" onClick={() => setMenu((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Xóa mục" className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700"><Trash2 size={15} /></button></div>)}
        </div>
        <button type="button" onClick={() => setMenu((current) => ({ ...current, items: [...current.items, { label: "", href: "/", isEnabled: true, sortOrder: current.items.length * 10 }] }))} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-bold"><Plus size={16} /> Thêm mục</button>
        {message && <p className="mt-4 text-sm font-semibold text-zinc-600">{message}</p>}
        <div className="mt-5 border-t border-zinc-200 pt-5"><button type="button" onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white"><Save size={16} /> Lưu menu</button></div>
      </section>
    </main>
  );
}

