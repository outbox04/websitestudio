"use client";

import { Filter, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { TloraCmsCategory, TloraCmsPost } from "@/types/scope";

export function TloraPostsManager({ initialPosts, categories }: { initialPosts: TloraCmsPost[]; categories: TloraCmsCategory[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  const filtered = useMemo(() => posts.filter((post) => {
    if (status !== "all" && post.status !== status) return false;
    if (category && !post.categoryIds.includes(category)) return false;
    if (date && !post.updatedAt.startsWith(date)) return false;
    return true;
  }), [category, date, posts, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function applyBulk() {
    if (!selected.length || !bulkAction) return;
    if (bulkAction === "delete" && window.confirm(`Lưu trữ ${selected.length} bài viết?`)) {
      await Promise.all(selected.map((id) => fetch(`/api/admin/tlora/posts?id=${id}`, { method: "DELETE" })));
      setPosts((current) => current.filter((post) => !selected.includes(post.id)));
      setSelected([]);
    }
    if (bulkAction === "edit") window.location.href = `/admin/tlora/posts/${selected[0]}`;
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between gap-4"><h1 className="text-3xl font-extrabold">BÀI VIẾT</h1><Link href="/admin/tlora/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><Plus size={17} /> Thêm bài viết</Link></header>
      <div className="mt-5 flex flex-wrap gap-4 border-b border-zinc-300 pb-3 text-sm font-bold">
        <button onClick={() => { setStatus("all"); setPage(1); }}>Tất cả ({posts.length})</button><span>|</span>
        <button onClick={() => { setStatus("published"); setPage(1); }}>Đã xuất bản ({publishedCount})</button><span>|</span>
        <button onClick={() => { setStatus("draft"); setPage(1); }}>Bản nháp ({draftCount})</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm"><option value="">Hành động hàng loạt</option><option value="edit">Chỉnh sửa</option><option value="delete">Xóa</option></select>
        <button type="button" onClick={applyBulk} className="min-h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold">Áp dụng</button>
        <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} className="ml-auto min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm" />
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm"><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><Filter size={15} /> Lọc</button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-zinc-50"><tr><th className="p-3"><input type="checkbox" checked={rows.length > 0 && rows.every((row) => selected.includes(row.id))} onChange={(event) => setSelected(event.target.checked ? Array.from(new Set([...selected, ...rows.map((row) => row.id)])) : selected.filter((id) => !rows.some((row) => row.id === id)))} /></th><th>Tiêu đề</th><th>Tác giả</th><th>Danh mục</th><th>Từ khóa</th><th>Tên đường dẫn</th><th>Thời gian</th><th /></tr></thead>
          <tbody className="divide-y divide-zinc-100">{rows.map((post) => <tr key={post.id}><td className="p-3"><input type="checkbox" checked={selected.includes(post.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, post.id] : current.filter((id) => id !== post.id))} /></td><td className="max-w-xs p-3"><Link href={`/admin/tlora/posts/${post.id}`} className="font-bold hover:underline">{post.title}</Link><p className="mt-1 text-xs text-zinc-500">{post.status === "published" ? "Đã xuất bản" : "Bản nháp"}</p></td><td>TLORA</td><td>{post.categoryIds.map((id) => categories.find((item) => item.id === id)?.name).filter(Boolean).join(", ") || "—"}</td><td className="max-w-52">{post.keywords.join(", ") || "—"}</td><td><a href={`/tin-tuc/${post.slug}`} target="_blank" className="text-blue-700 hover:underline">/{post.slug}</a></td><td>{new Date(post.updatedAt).toLocaleDateString("vi-VN")}</td><td><button type="button" onClick={async () => { if (!window.confirm("Lưu trữ bài viết?")) return; await fetch(`/api/admin/tlora/posts?id=${post.id}`, { method: "DELETE" }); setPosts((current) => current.filter((item) => item.id !== post.id)); }} className="text-red-700"><Trash2 size={16} /></button></td></tr>)}</tbody>
        </table>
      </div>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3"><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm">{[10, 20, 50, 100].map((size) => <option key={size}>{size}</option>)}</select><div className="flex items-center gap-1"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="size-9 rounded border disabled:opacity-30">&lt;</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setPage(value)} className={`size-9 rounded border ${page === value ? "bg-zinc-950 text-white" : "bg-white"}`}>{value}</button>)}<button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="size-9 rounded border disabled:opacity-30">&gt;</button></div></footer>
    </main>
  );
}
