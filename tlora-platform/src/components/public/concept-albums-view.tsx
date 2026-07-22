"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ConceptAlbumCard } from "@/components/public/concept-album-card";
import type { TloraConceptAlbum, TloraConceptCategory } from "@/types/scope";

const pageSize = 15;

const searchAliases: Record<string, string[]> = {
  "sinh nhat": ["sinhnhat", "birthday", "birthday party", "happy birthday", "thoi noi"],
  "gia dinh": ["giadinh", "family", "family photo"],
  "cuoi": ["wedding", "prewedding", "pre wedding", "bridal"],
  "me va be": ["mebe", "mother baby", "mom baby", "maternity"],
  "ca nhan": ["canhan", "portrait", "personal"],
  "thoi trang": ["thoitrang", "fashion", "editorial"],
};

export function normalizeAlbumSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalizeAlbumSearch(value).replace(/\s+/g, "");
}

function searchableValues(album: TloraConceptAlbum) {
  const raw = [album.title, album.excerpt, album.categoryName || "", album.categorySlug || "", ...album.tags];
  const normalized = raw.flatMap((value) => [normalizeAlbumSearch(value), compact(value)]);
  for (const [canonical, aliases] of Object.entries(searchAliases)) {
    if ([canonical, ...aliases].some((alias) => normalized.some((value) => value.includes(compact(alias)) || value.includes(normalizeAlbumSearch(alias))))) {
      normalized.push(canonical, compact(canonical), ...aliases.flatMap((alias) => [normalizeAlbumSearch(alias), compact(alias)]));
    }
  }
  return normalized.join(" ");
}

export function ConceptAlbumsView({ albums, categories }: { albums: TloraConceptAlbum[]; categories: TloraConceptCategory[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const normalizedQuery = normalizeAlbumSearch(query);
  const compactQuery = compact(query);
  const availableCategories = useMemo(() => categories.map((item) => ({ ...item, publicCount: albums.filter((album) => album.categoryId === item.id).length })).filter((item) => item.publicCount > 0), [albums, categories]);
  const filtered = useMemo(() => albums.filter((album) => {
    if (category !== "all" && album.categorySlug !== category) return false;
    if (!normalizedQuery) return true;
    const haystack = searchableValues(album);
    return haystack.includes(normalizedQuery) || haystack.includes(compactQuery);
  }), [albums, category, compactQuery, normalizedQuery]);
  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    const values = albums.flatMap((album) => [album.categoryName, ...album.tags]).filter((value): value is string => Boolean(value?.trim()));
    return Array.from(new Set(values)).filter((value) => {
      const normalized = normalizeAlbumSearch(value);
      const aliases = searchAliases[normalized] || [];
      return normalized.includes(normalizedQuery) || compact(value).includes(compactQuery) || aliases.some((alias) => compact(alias).includes(compactQuery));
    }).slice(0, 6);
  }, [albums, compactQuery, normalizedQuery]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function chooseCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function search(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <>
      <section className="mb-8 rounded-xl border border-white/10 bg-[#101115] p-4 sm:p-5" aria-label="Tìm và lọc album">
        <label className="relative block">
          <span className="sr-only">Tìm kiếm album theo tên, tag hoặc danh mục</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8174]" size={20} aria-hidden="true" />
          <input value={query} onChange={(event) => search(event.target.value)} placeholder="Tìm sinh nhật, birthday, gia đình, cưới..." className="min-h-13 w-full rounded-lg border border-white/10 bg-[#07080a] py-3 pl-12 pr-12 text-base text-[#f8f5ee] outline-none transition placeholder:text-[#8c8174] focus:border-[#d8b766] focus:ring-2 focus:ring-[#d8b766]/15" autoComplete="off" />
          {query && <button type="button" onClick={() => search("")} aria-label="Xoá nội dung tìm kiếm" className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-[#8c8174] hover:bg-white/5 hover:text-white"><X size={17} /></button>}
        </label>
        {suggestions.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-[#8c8174]">Gợi ý:</span>{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => search(suggestion)} className="rounded-full border border-[#d8b766]/30 px-3 py-1.5 text-xs font-bold text-[#f3d88e] hover:border-[#d8b766]">{suggestion}</button>)}</div>}
      </section>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2" aria-label="Lọc album theo danh mục">
        <FilterButton active={category === "all"} onClick={() => chooseCategory("all")}>Tất cả <span>{albums.length}</span></FilterButton>
        {availableCategories.map((item) => <FilterButton key={item.id} active={category === item.slug} onClick={() => chooseCategory(item.slug)}>{item.name} <span>{item.publicCount}</span></FilterButton>)}
      </div>

      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-[#8c8174]" aria-live="polite"><p>{query ? <>Tìm thấy <strong className="text-[#f8f5ee]">{filtered.length}</strong> album cho “{query}”</> : <><strong className="text-[#f8f5ee]">{filtered.length}</strong> album</>}</p>{(query || category !== "all") && <button type="button" onClick={() => { search(""); chooseCategory("all"); }} className="font-bold text-[#f3d88e]">Xoá bộ lọc</button>}</div>

      {visible.length ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map((album, index) => <ConceptAlbumCard key={album.id} album={album} order={(safePage - 1) * pageSize + index + 1} priority={safePage === 1 && index === 0} />)}</div> : <p className="rounded-xl border border-dashed border-white/15 p-10 text-center text-[#8c8174]">Không tìm thấy album phù hợp. Hãy thử tên khác hoặc chọn “Tất cả”.</p>}

      {totalPages > 1 && <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang Album Concept"><button type="button" disabled={safePage === 1} onClick={() => setPage((value) => value - 1)} className="grid size-11 place-items-center rounded-md border border-white/15 disabled:opacity-30" aria-label="Trang trước"><ChevronLeft /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => <button type="button" key={value} onClick={() => setPage(value)} aria-current={safePage === value ? "page" : undefined} className={`size-11 rounded-md border text-sm font-bold ${safePage === value ? "border-[#d8b766] bg-[#d8b766] text-[#07080a]" : "border-white/15 text-[#cbc0b0]"}`}>{value}</button>)}<button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => value + 1)} className="grid size-11 place-items-center rounded-md border border-white/15 disabled:opacity-30" aria-label="Trang sau"><ChevronRight /></button></nav>}
    </>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${active ? "border-[#d8b766] bg-[#d8b766] text-[#07080a]" : "border-white/15 bg-white/[.03] text-[#cbc0b0] hover:border-[#d8b766]/60 hover:text-white"} [&_span]:text-xs [&_span]:opacity-70`}>{children}</button>;
}
