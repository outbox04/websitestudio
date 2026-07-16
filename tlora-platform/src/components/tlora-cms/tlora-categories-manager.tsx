"use client";

import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { cmsCategorySchema } from "@/schemas/tlora-cms";
import type { TloraCmsCategory } from "@/types/scope";

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function TloraCategoriesManager({ initialCategories }: { initialCategories: TloraCmsCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<{ id?: string; name: string; slug: string; description: string }>({ name: "", slug: "", description: "" });
  const [message, setMessage] = useState("");

  async function save() {
    const parsed = cmsCategorySchema.safeParse(form);
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Danh mục không hợp lệ.");
    const response = await fetch("/api/admin/tlora/categories", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const result = await response.json() as { category?: TloraCmsCategory; error?: string };
    if (!response.ok || !result.category) return setMessage(result.error || "Không thể lưu danh mục.");
    setCategories((current) => [...current.filter((item) => item.id !== result.category?.id), result.category!].sort((a, b) => a.name.localeCompare(b.name, "vi")));
    setForm({ id: result.category.id, name: result.category.name, slug: result.category.slug, description: result.category.description || "" });
    setMessage("Đã lưu danh mục.");
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Taxonomy</p><h1 className="mt-2 text-3xl font-extrabold">Danh mục bài viết</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="space-y-4">
            <Field label="Tên danh mục" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name, slug: current.id ? current.slug : slugify(name) }))} />
            <Field label="Tên đường dẫn" value={form.slug} onChange={(slug) => setForm((current) => ({ ...current, slug: slugify(slug) }))} />
            <Field label="Mô tả" value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
          </div>
          {message && <p className="mt-4 text-sm font-semibold text-zinc-600">{message}</p>}
          <div className="mt-5 flex gap-2"><button type="button" onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><Save size={16} /> Lưu</button><button type="button" onClick={() => setForm({ name: "", slug: "", description: "" })} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-bold"><Plus size={16} /> Mới</button></div>
        </section>
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white"><div className="border-b border-zinc-200 px-5 py-4 font-bold">{categories.length} danh mục</div><div className="divide-y divide-zinc-100">{categories.map((category) => <button key={category.id} type="button" onClick={() => setForm({ id: category.id, name: category.name, slug: category.slug, description: category.description || "" })} className="block w-full p-5 text-left hover:bg-zinc-50"><p className="font-bold">{category.name}</p><p className="mt-1 text-xs text-zinc-500">/{category.slug}</p>{category.description && <p className="mt-2 text-sm text-zinc-600">{category.description}</p>}</button>)}</div></section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-zinc-950" /></label>;
}
