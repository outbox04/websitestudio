"use client";

import { Bold, Check, Heading1, Heading2, ImagePlus, Italic, Link2, Loader2, Save, Send, Underline, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TloraImageCropper } from "@/components/tlora-cms/tlora-og-image-cropper";
import { optimizeImageForWeb } from "@/lib/client/image-optimizer";
import { cmsPostSchema } from "@/schemas/tlora-cms";
import type { TloraCmsCategory, TloraCmsMediaAsset, TloraCmsPost } from "@/types/scope";

type Form = { id?: string; title: string; slug: string; excerpt: string; body: string; coverImageUrl: string; keywords: string[]; categoryIds: string[] };
const empty: Form = { title: "", slug: "", excerpt: "", body: "", coverImageUrl: "", keywords: [], categoryIds: [] };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function TloraPostEditor({ post, categories, initialMedia, keywordSuggestions = {} }: { post?: TloraCmsPost; categories: TloraCmsCategory[]; initialMedia: TloraCmsMediaAsset[]; keywordSuggestions?: Record<string, number> }) {
  const [form, setForm] = useState<Form>(post ? { id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt || "", body: post.body, coverImageUrl: post.coverImageUrl || "", keywords: post.keywords, categoryIds: post.categoryIds } : empty);
  const [media, setMedia] = useState(initialMedia);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [keyword, setKeyword] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageOpen, setImageOpen] = useState<"cover" | "content" | null>(null);
  const [imageDialogInitial, setImageDialogInitial] = useState<{ asset?: TloraCmsMediaAsset; width: string }>({ width: "100%" });
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const editingImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (mode === "visual" && editorRef.current && editorRef.current.innerHTML !== form.body) editorRef.current.innerHTML = form.body;
  }, [form.body, mode]);

  const valid = Boolean(form.title.trim() && form.slug.trim() && form.excerpt.trim() && form.body.trim() && form.coverImageUrl);

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount) selectionRef.current = selection.getRangeAt(0).cloneRange();
  }
  function restoreSelection() {
    const range = selectionRef.current;
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  function command(name: string, value?: string) {
    restoreSelection();
    document.execCommand(name, false, value);
    if (editorRef.current) setForm((current) => ({ ...current, body: editorRef.current?.innerHTML || "" }));
    editorRef.current?.focus();
  }
  function openLink() {
    rememberSelection();
    const node = window.getSelection()?.anchorNode;
    const anchor = (node instanceof Element ? node : node?.parentElement)?.closest("a");
    setLinkUrl(anchor?.getAttribute("href") || "");
    setLinkOpen(true);
  }
  function applyLink() {
    restoreSelection();
    if (linkUrl.trim()) document.execCommand("createLink", false, linkUrl.trim());
    else document.execCommand("unlink");
    if (editorRef.current) setForm((current) => ({ ...current, body: editorRef.current?.innerHTML || "" }));
    setLinkOpen(false);
  }
  function addKeyword(value: string) {
    const next = value.trim().replace(/,$/, "");
    if (next && !form.keywords.includes(next)) setForm((current) => ({ ...current, keywords: [...current.keywords, next] }));
    setKeyword("");
  }

  async function save(publishAfter = false) {
    const parsed = cmsPostSchema.safeParse(form);
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message || "Vui lòng hoàn thiện các trường bắt buộc.");
    setBusy(publishAfter ? "publish" : "save");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tlora/posts", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json() as { post?: TloraCmsPost; error?: string };
      if (!response.ok || !result.post) throw new Error(result.error || "Không thể lưu bài viết.");
      setForm((current) => ({ ...current, id: result.post!.id }));
      if (publishAfter) {
        const publishResponse = await fetch("/api/admin/tlora/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: result.post.id, changeNote: "Xuất bản từ trình soạn thảo" }) });
        if (!publishResponse.ok) throw new Error("Không thể xuất bản bài viết.");
      }
      setMessage(publishAfter ? "Đã xuất bản bài viết." : "Đã lưu bản nháp.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu bài viết.");
    } finally {
      setBusy("");
    }
  }

  function applyImage(asset: TloraCmsMediaAsset, alt: string, description: string, width: string) {
    if (!asset.publicUrl) return;
    void fetch("/api/admin/tlora/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: asset.id, altText: alt, description }) });
    setMedia((current) => current.map((item) => item.id === asset.id ? { ...item, altText: alt, description } : item));
    if (imageOpen === "cover") setForm((current) => ({ ...current, coverImageUrl: asset.publicUrl || "" }));
    else if (editingImageRef.current) {
      editingImageRef.current.src = asset.publicUrl;
      editingImageRef.current.alt = alt;
      editingImageRef.current.style.width = width;
      editingImageRef.current = null;
      setForm((current) => ({ ...current, body: editorRef.current?.innerHTML || current.body }));
    } else {
      restoreSelection();
      document.execCommand("insertHTML", false, `<img src="${asset.publicUrl}" alt="${escapeHtml(alt)}" style="width:${width};height:auto" />`);
      setForm((current) => ({ ...current, body: editorRef.current?.innerHTML || current.body }));
    }
    setImageOpen(null);
  }

  return (
    <main className="min-h-screen bg-[#f4f4f2] p-4 text-zinc-950 sm:p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) }))} placeholder="Nhập tiêu đề bài viết" className="w-full border-0 bg-transparent text-3xl font-black outline-none sm:text-4xl" />
          <label className="mt-4 block text-sm font-bold">Tên đường dẫn<input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 font-normal" /></label>
          <div className="mt-5 overflow-hidden rounded-xl border border-zinc-300 bg-white">
            <div className="flex border-b border-zinc-200"><button type="button" onClick={() => setMode("visual")} className={`px-4 py-3 text-sm font-bold ${mode === "visual" ? "bg-zinc-950 text-white" : ""}`}>Soạn thảo</button><button type="button" onClick={() => setMode("html")} className={`px-4 py-3 text-sm font-bold ${mode === "html" ? "bg-zinc-950 text-white" : ""}`}>HTML</button></div>
            {mode === "visual" ? <><div className="sticky top-0 z-10 overflow-x-auto border-b border-zinc-200 bg-zinc-50 p-2"><div className="flex min-w-max items-center gap-1"><select aria-label="Cỡ chữ" onMouseDown={rememberSelection} onChange={(event) => command("fontSize", event.target.value)} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm"><option value="3">16px</option><option value="4">18px</option><option value="5">24px</option><option value="6">32px</option></select><span className="mx-1 h-6 w-px bg-zinc-300" /><Tool label="Tiêu đề H1" icon={<Heading1 />} onClick={() => command("formatBlock", "h1")} /><Tool label="Tiêu đề H2" icon={<Heading2 />} onClick={() => command("formatBlock", "h2")} /><button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }} onClick={() => command("formatBlock", "h3")} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm font-bold">H3</button><button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }} onClick={() => command("formatBlock", "p")} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm">Đoạn văn</button><span className="mx-1 h-6 w-px bg-zinc-300" /><Tool label="Đậm" icon={<Bold />} onClick={() => command("bold")} /><Tool label="Nghiêng" icon={<Italic />} onClick={() => command("italic")} /><Tool label="Gạch chân" icon={<Underline />} onClick={() => command("underline")} /><span className="mx-1 h-6 w-px bg-zinc-300" /><Tool label="Liên kết" icon={<Link2 />} onClick={openLink} /><Tool label="Thêm ảnh" icon={<ImagePlus />} onClick={() => { rememberSelection(); editingImageRef.current = null; setImageDialogInitial({ width: "100%" }); setImageOpen("content"); }} /></div></div>{linkOpen && <div className="flex gap-2 border-b border-zinc-200 bg-amber-50 p-2"><input autoFocus value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://..." className="min-h-9 flex-1 rounded border px-3 text-sm" /><button type="button" onClick={applyLink} className="grid size-9 place-items-center rounded bg-zinc-950 text-white"><Check size={16} /></button><button type="button" onClick={() => setLinkOpen(false)} className="grid size-9 place-items-center"><X size={16} /></button></div>}<div ref={editorRef} contentEditable suppressContentEditableWarning onClick={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }} onInput={(event) => { setForm((current) => ({ ...current, body: event.currentTarget.innerHTML })); rememberSelection(); }} onMouseUp={rememberSelection} onKeyUp={rememberSelection} onDoubleClick={(event) => { const target = event.target; if (target instanceof HTMLImageElement) { editingImageRef.current = target; setImageDialogInitial({ asset: media.find((asset) => asset.publicUrl === target.getAttribute("src")), width: target.style.width || "100%" }); setImageOpen("content"); } }} className="prose prose-zinc min-h-[520px] max-w-none p-6 text-base leading-8 outline-none" /></> : <textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="min-h-[620px] w-full bg-zinc-950 p-5 font-mono text-sm leading-7 text-emerald-200 outline-none" />}
          </div>
        </section>
        <aside className="space-y-5">
          <Panel title="Ảnh đại diện / OG Meta"><p className="mb-3 text-xs leading-5 text-zinc-500">Khung chuẩn 16:9. Có thể kéo ảnh và thu phóng trước khi lưu.</p><button type="button" onClick={() => { setImageDialogInitial({ asset: media.find((asset) => asset.publicUrl === form.coverImageUrl), width: "100%" }); setImageOpen("cover"); }} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 text-xs font-bold"><ImagePlus size={15} /> {form.coverImageUrl ? "Thay ảnh" : "Chọn ảnh đại diện"}</button>{form.coverImageUrl && <TloraImageCropper key={`post-cover:${form.coverImageUrl}`} imageUrl={form.coverImageUrl} filePrefix={`post-cover-${form.slug || "bai-viet"}`} altText={form.title || "Ảnh đại diện bài viết"} variant="light" outputWidth={1200} outputHeight={675} saveLabel="Lưu ảnh đại diện 16:9" onApplied={(coverImageUrl) => setForm((current) => ({ ...current, coverImageUrl }))} onUploaded={(asset) => setMedia((current) => [asset, ...current])} />}</Panel>
          <Panel title="Mô tả SEO"><textarea value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} className="min-h-28 w-full rounded-md border border-zinc-300 p-3 text-sm" /><p className={`mt-2 text-right text-xs font-bold ${form.excerpt.length > 120 ? "text-red-600" : "text-zinc-500"}`}>{form.excerpt.length}/120 {form.excerpt.length > 120 && "· Cảnh báo: nội dung có thể bị mất chữ khi hiển thị."}</p></Panel>
          <Panel title="Danh mục"><div className="flex flex-wrap gap-2">{categories.map((category) => <label key={category.id} className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold"><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={(event) => setForm((current) => ({ ...current, categoryIds: event.target.checked ? [...current.categoryIds, category.id] : current.categoryIds.filter((id) => id !== category.id) }))} />{category.name}</label>)}</div></Panel>
          <Panel title="Từ khóa"><div className="flex flex-wrap gap-2">{form.keywords.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-2 text-xs font-bold text-white">{item}<button onClick={() => setForm((current) => ({ ...current, keywords: current.keywords.filter((value) => value !== item) }))}><X size={13} /></button></span>)}</div><input value={keyword} onChange={(event) => { const value = event.target.value; if (value.endsWith(",")) addKeyword(value); else setKeyword(value); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addKeyword(keyword); } }} placeholder="Nhập từ khóa rồi Enter hoặc dấu phẩy" className="mt-3 min-h-10 w-full rounded-md border border-zinc-300 px-3 text-sm" />{keyword && <div className="mt-2 max-h-36 overflow-y-auto rounded-md border bg-white">{Object.entries(keywordSuggestions).filter(([value]) => value.toLowerCase().includes(keyword.toLowerCase()) && !form.keywords.includes(value)).slice(0,8).map(([value,count]) => <button key={value} onClick={() => addKeyword(value)} className="flex w-full justify-between px-3 py-2 text-left text-xs hover:bg-zinc-50"><span>{value}</span><b>{count} bài</b></button>)}</div>}</Panel>
          {message && <p className="rounded-md bg-white p-3 text-sm font-bold">{message}</p>}
          <div className="grid grid-cols-2 gap-2"><button disabled={!valid || Boolean(busy)} onClick={() => save(false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-bold text-white disabled:opacity-40">{busy === "save" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Lưu bản nháp</button><button disabled={!valid || Boolean(busy)} onClick={() => save(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d8b766] px-3 text-sm font-bold disabled:opacity-40">{busy === "publish" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Xuất bản</button></div>
          {!valid && <p className="text-xs font-semibold text-red-600">Cần nhập tiêu đề, tên đường dẫn, mô tả SEO, nội dung và ảnh đại diện.</p>}
        </aside>
      </div>
      {imageOpen && <PostImageDialog assets={media} initialAsset={imageDialogInitial.asset} initialWidth={imageDialogInitial.width} onClose={() => setImageOpen(null)} onUploaded={(asset) => setMedia((current) => [asset, ...current])} onConfirm={applyImage} />}
    </main>
  );
}

function Tool({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) { return <button type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="grid size-9 shrink-0 place-items-center rounded border border-zinc-300 bg-white text-zinc-800 transition hover:border-zinc-500 hover:bg-zinc-100 [&_svg]:size-4">{icon}</button>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-zinc-200 bg-white p-4"><h2 className="mb-3 text-sm font-extrabold">{title}</h2>{children}</section>; }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character); }

function PostImageDialog({ assets, initialAsset, initialWidth, onClose, onConfirm, onUploaded }: { assets: TloraCmsMediaAsset[]; initialAsset?: TloraCmsMediaAsset; initialWidth: string; onClose: () => void; onConfirm: (asset: TloraCmsMediaAsset, alt: string, description: string, width: string) => void; onUploaded: (asset: TloraCmsMediaAsset) => void }) {
  const [selected, setSelected] = useState<TloraCmsMediaAsset | null>(initialAsset || null);
  const [alt, setAlt] = useState(initialAsset?.altText || "");
  const [description, setDescription] = useState(initialAsset?.description || "");
  const [width, setWidth] = useState(initialWidth);
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    const optimized = await optimizeImageForWeb(file);
    const form = new FormData(); form.set("file", optimized.file); form.set("altText", file.name.replace(/\.[^.]+$/, "")); form.set("width", String(optimized.width)); form.set("height", String(optimized.height));
    const response = await fetch("/api/admin/tlora/media", { method: "POST", body: form }); const result = await response.json() as { media?: TloraCmsMediaAsset };
    URL.revokeObjectURL(optimized.previewUrl); setBusy(false);
    if (result.media) { onUploaded(result.media); choose(result.media); }
  }
  function choose(asset: TloraCmsMediaAsset) { setSelected(asset); setAlt(asset.altText || ""); setDescription(asset.description || ""); }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4"><section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5"><div className="flex justify-between"><h2 className="text-xl font-black">Chọn hoặc tải ảnh</h2><button onClick={onClose}><X /></button></div><label className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><ImagePlus size={16} />{busy ? "Đang tối ưu..." : "Tải ảnh lên"}<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label><div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{assets.filter((asset) => asset.publicUrl).map((asset) => <button key={asset.id} onClick={() => choose(asset)} className={`aspect-square rounded-md border-2 bg-cover bg-center ${selected?.id === asset.id ? "border-[#d8b766]" : "border-transparent"}`} style={{ backgroundImage: `url(${asset.publicUrl})` }} />)}</div>{selected && <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="aspect-video rounded-md bg-zinc-100 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${selected.publicUrl})` }} /><div className="space-y-3"><label className="block text-sm font-bold">Alt<input value={alt} onChange={(event) => setAlt(event.target.value)} className="mt-1 min-h-10 w-full rounded border px-3 font-normal" /></label><label className="block text-sm font-bold">Mô tả ảnh khi lỗi<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-20 w-full rounded border p-3 font-normal" /></label><label className="block text-sm font-bold">Kích cỡ hiển thị<select value={width} onChange={(event) => setWidth(event.target.value)} className="mt-1 min-h-10 w-full rounded border px-3 font-normal"><option value="25%">25%</option><option value="50%">50%</option><option value="75%">75%</option><option value="100%">100%</option></select></label><button disabled={!alt.trim()} onClick={() => onConfirm(selected, alt, description, width)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d8b766] font-bold disabled:opacity-40"><Check size={17} /> Xác nhận ảnh và Alt</button></div></div>}</section></div>;
}
