"use client";

import { Archive, FilePlus2, Loader2, Save, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { cmsPostSchema } from "@/schemas/tlora-cms";
import type { TloraCmsCategory, TloraCmsPost } from "@/types/scope";

type Form = { id?: string; title: string; slug: string; excerpt: string; body: string; coverImageUrl: string; keywords: string; categoryIds: string[] };
const emptyForm: Form = { title: "", slug: "", excerpt: "", body: "", coverImageUrl: "", keywords: "", categoryIds: [] };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function TloraPostsManager({ initialPosts, categories }: { initialPosts: TloraCmsPost[]; categories: TloraCmsCategory[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const selected = useMemo(() => posts.find((post) => post.id === form.id), [posts, form.id]);

  function edit(post: TloraCmsPost) {
    setForm({ id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt || "", body: post.body, coverImageUrl: post.coverImageUrl || "", keywords: post.keywords.join(", "), categoryIds: post.categoryIds });
    setMessage("");
  }

  async function save() {
    const parsed = cmsPostSchema.safeParse({ ...form, keywords: form.keywords.split(",").map((item) => item.trim()).filter(Boolean) });
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Dữ liệu bài viết không hợp lệ.");
    setBusy("save");
    try {
      const response = await fetch("/api/admin/tlora/posts", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json() as { post?: TloraCmsPost; error?: string };
      if (!response.ok || !result.post) throw new Error(result.error || "Không thể lưu bài viết.");
      setPosts((current) => [result.post!, ...current.filter((post) => post.id !== result.post?.id)]);
      edit(result.post);
      setMessage("Đã lưu bản nháp bài viết.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu bài viết.");
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    if (!form.id) return;
    setBusy("publish");
    try {
      const response = await fetch("/api/admin/tlora/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: form.id, changeNote: "Xuất bản từ TLORA CMS" }) });
      const result = await response.json() as { post?: TloraCmsPost; error?: string };
      if (!response.ok || !result.post) throw new Error(result.error || "Không thể xuất bản.");
      setPosts((current) => current.map((post) => post.id === result.post?.id ? result.post! : post));
      setMessage("Bài viết đã được xuất bản và tạo phiên bản khôi phục.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xuất bản.");
    } finally {
      setBusy("");
    }
  }

  async function archive() {
    if (!form.id) return;
    if (!window.confirm("Lưu trữ bài viết này?")) return;
    setBusy("archive");
    const response = await fetch(`/api/admin/tlora/posts?id=${form.id}`, { method: "DELETE" });
    if (response.ok) {
      setPosts((current) => current.filter((post) => post.id !== form.id));
      setForm(emptyForm);
      setMessage("Đã lưu trữ bài viết.");
    } else setMessage("Không thể lưu trữ bài viết.");
    setBusy("");
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#a57f2c]">Nội dung truyền cảm hứng</p><h1 className="mt-2 text-3xl font-extrabold">Bài viết</h1><p className="mt-2 text-sm text-zinc-600">Chia sẻ gợi ý chọn concept, chuẩn bị trang phục, tạo dáng và những câu chuyện phía sau mỗi bộ ảnh.</p></div>
        <button type="button" onClick={() => setForm(emptyForm)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><FilePlus2 size={17} /> Bài viết mới</button>
      </header>
      <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-bold">{posts.length} bài viết</div>
          <div className="max-h-[760px] divide-y divide-zinc-100 overflow-y-auto">
            {posts.map((post) => <button key={post.id} type="button" onClick={() => edit(post)} className={`block w-full p-4 text-left ${form.id === post.id ? "bg-[#f5efe1]" : "hover:bg-zinc-50"}`}><div className="flex justify-between gap-3"><p className="font-bold">{post.title}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${post.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{post.status === "published" ? "Published" : "Draft"}</span></div><p className="mt-1 truncate text-xs text-zinc-500">/{post.slug}</p></button>)}
            {!posts.length && <p className="p-6 text-center text-sm text-zinc-500">Chưa có bài viết.</p>}
          </div>
        </aside>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tiêu đề" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title, slug: current.id ? current.slug : slugify(title) }))} />
            <Field label="Slug" value={form.slug} onChange={(slug) => setForm((current) => ({ ...current, slug: slugify(slug) }))} />
            <div className="sm:col-span-2"><Field label="Mô tả SEO" value={form.excerpt} onChange={(excerpt) => setForm((current) => ({ ...current, excerpt }))} textarea /></div>
            <Field label="Ảnh bìa từ Media Library" value={form.coverImageUrl} onChange={(coverImageUrl) => setForm((current) => ({ ...current, coverImageUrl }))} />
            <Field label="Từ khóa, phân cách dấu phẩy" value={form.keywords} onChange={(keywords) => setForm((current) => ({ ...current, keywords }))} />
            <fieldset className="sm:col-span-2"><legend className="text-sm font-bold text-zinc-800">Danh mục</legend><div className="mt-2 flex flex-wrap gap-2">{categories.map((category) => <label key={category.id} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${form.categoryIds.includes(category.id) ? "border-[#d8b766] bg-[#f5efe1]" : "border-zinc-300"}`}><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={(event) => setForm((current) => ({ ...current, categoryIds: event.target.checked ? [...current.categoryIds, category.id] : current.categoryIds.filter((id) => id !== category.id) }))} />{category.name}</label>)}</div></fieldset>
            <div className="sm:col-span-2"><Field label="Nội dung bài viết" value={form.body} onChange={(body) => setForm((current) => ({ ...current, body }))} textarea tall /></div>
          </div>
          {message && <p className={`mt-4 rounded-md p-3 text-sm font-semibold ${message.startsWith("Đã") || message.startsWith("Bài") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-bold text-white disabled:opacity-50">{busy === "save" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Lưu bản nháp</button>
            <button type="button" onClick={publish} disabled={!form.id || Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d8b766] px-5 text-sm font-bold text-zinc-950 disabled:opacity-50"><Send size={16} /> Xuất bản</button>
            {selected && <button type="button" onClick={archive} disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 px-4 text-sm font-bold text-red-700"><Archive size={16} /> Lưu trữ</button>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, textarea = false, tall = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; tall?: boolean }) {
  return <label className="block text-sm font-bold text-zinc-800">{label}{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`mt-2 w-full rounded-md border border-zinc-300 p-3 font-normal outline-none focus:border-zinc-950 ${tall ? "min-h-80" : "min-h-24"}`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 px-3 font-normal outline-none focus:border-zinc-950" />}</label>;
}
