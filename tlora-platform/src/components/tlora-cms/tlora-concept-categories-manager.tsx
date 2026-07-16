"use client";

import { Pencil, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { conceptCategorySchema } from "@/schemas/tlora-cms";
import type { TloraConceptCategory } from "@/types/scope";

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const empty = { name: "", slug: "" };

export function TloraConceptCategoriesManager({ initialCategories }: { initialCategories: TloraConceptCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<{ id?: string; name: string; slug: string }>(empty);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsed = conceptCategorySchema.safeParse(form);
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Danh mục chưa hợp lệ.");
    setBusy(true);
    const response = await fetch("/api/admin/tlora/concept-categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const result = await response.json() as { category?: TloraConceptCategory; error?: string };
    setBusy(false);
    if (!response.ok || !result.category) return setMessage(result.error || "Không thể lưu danh mục.");
    setCategories((current) => {
      const previous = current.find((item) => item.id === result.category?.id);
      const saved = { ...result.category!, albumCount: previous?.albumCount || 0, imageCount: previous?.imageCount || 0 };
      return [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    });
    setForm(empty);
    setMessage("Đã lưu danh mục Concept.");
  }

  async function remove(category: TloraConceptCategory) {
    if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return;
    const response = await fetch(`/api/admin/tlora/concept-categories?id=${category.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return setMessage(result.error || "Không thể xóa danh mục.");
    setCategories((current) => current.filter((item) => item.id !== category.id));
    if (form.id === category.id) setForm(empty);
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Thư viện Concept</p>
      <h1 className="mt-2 text-3xl font-extrabold">Danh mục Concept</h1>
      <p className="mt-2 text-sm text-zinc-600">Tạo nhóm lọc cho trang Album Concept và theo dõi số album, số ảnh đang sử dụng.</p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên danh mục" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name, slug: current.id ? current.slug : slugify(name) }))} />
          <Field label="Tên đường dẫn" value={form.slug} onChange={(slug) => setForm((current) => ({ ...current, slug: slugify(slug) }))} />
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-zinc-600">{message}</p>}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-200 pt-5">
          <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white disabled:opacity-50"><Save size={16} /> {form.id ? "Lưu thay đổi" : "Tạo danh mục"}</button>
          {form.id && <button type="button" onClick={() => setForm(empty)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 px-5 text-sm font-bold"><X size={16} /> Hủy sửa</button>}
        </div>
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-zinc-50"><tr><th className="p-4">Tên danh mục</th><th>Tên đường dẫn</th><th>Số album</th><th>Số ảnh</th><th className="pr-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-zinc-100">{categories.map((category) => <tr key={category.id}><td className="p-4 font-bold">{category.name}</td><td className="font-mono text-xs">/{category.slug}</td><td>{category.albumCount}</td><td>{category.imageCount}</td><td className="pr-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setForm({ id: category.id, name: category.name, slug: category.slug })} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-300 px-3 text-xs font-bold"><Pencil size={14} /> Sửa</button><button type="button" onClick={() => remove(category)} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-bold text-red-700"><Trash2 size={14} /> Xóa</button></div></td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-[#a57f2c]" /></label>;
}
