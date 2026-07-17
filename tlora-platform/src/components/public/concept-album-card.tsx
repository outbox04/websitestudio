"use client";

import { ArrowRight, ArrowUpRight, Eye, ImageOff, Images, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { TloraConceptAlbum } from "@/types/scope";

type ConceptAlbumCardProps = {
  album: TloraConceptAlbum;
  order: number;
  total: number;
  priority?: boolean;
  onOpen?: () => void;
  onConsult?: () => void;
};

function numberLabel(value: number) {
  return String(value).padStart(2, "0");
}

export function ConceptAlbumCard({ album, order, total, priority = false, onOpen, onConsult }: ConceptAlbumCardProps) {
  const [imageError, setImageError] = useState(false);
  const available = album.status === "published";
  const detailHref = `/album-concept?album=${encodeURIComponent(album.slug)}`;
  const consultHref = `/album-concept?consult=${encodeURIComponent(album.slug)}`;
  const imageCount = album.images.length;
  const category = album.categoryName || "Collection";
  const description = album.excerpt.trim().toLocaleLowerCase("vi") === album.title.trim().toLocaleLowerCase("vi") ? "" : album.excerpt.trim();

  const media = (
    <>
      {!imageError && album.coverImageUrl ? (
        <>
          <Image src={album.coverImageUrl} alt="" fill unoptimized className="scale-110 object-cover opacity-45 blur-2xl" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" aria-hidden="true" />
          <span className="absolute inset-0 bg-black/20" aria-hidden="true" />
          <Image src={album.coverImageUrl} alt={`Ảnh bìa album ${album.title}`} fill priority={priority} unoptimized onError={() => setImageError(true)} className="object-contain transition-transform duration-700 ease-out group-hover/card:scale-[1.035]" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
        </>
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[var(--surface-raised)] text-[var(--muted)]"><span className="text-center text-sm"><ImageOff className="mx-auto mb-2" aria-hidden="true" />Ảnh đang cập nhật</span></span>
      )}
      <span className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/90" aria-hidden="true" />
      <span className="absolute left-5 top-5 text-left sm:left-6 sm:top-6">
        <span className="block text-[11px] font-bold uppercase tracking-[.22em] text-[var(--brand-gold-soft)]">{category}</span>
        <span className="mt-2 block h-px w-8 bg-[var(--brand-gold)]" aria-hidden="true" />
      </span>
      <span className="absolute right-5 top-5 text-lg text-[var(--foreground)] sm:right-6 sm:top-6"><span className="text-[var(--brand-gold-soft)]">{numberLabel(order)}</span> / {numberLabel(total)}</span>
      <span className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 text-sm font-bold text-[var(--foreground)] sm:inset-x-6 sm:bottom-6">
        {imageCount > 0 ? <span className="inline-flex items-center gap-2"><Images size={18} aria-hidden="true" /> {imageCount} ảnh</span> : <span />}
        <span className="inline-flex items-center gap-2 text-base text-[var(--brand-gold-soft)]">Xem album <ArrowRight className="transition-transform duration-500 group-hover/card:translate-x-1.5" size={19} aria-hidden="true" /></span>
      </span>
    </>
  );

  return (
    <article className="group/card relative opacity-100 transition-[transform,border-color] duration-500 ease-out [animation:concept-card_.55s_ease-out_forwards] hover:-translate-y-1.5" style={{ animationDelay: `${((order - 1) % 15) * 55}ms` }}>
      <span aria-hidden="true" className="absolute inset-x-5 -top-2 hidden h-16 -rotate-1 rounded-[22px] border border-[var(--album-border)] bg-[var(--surface-raised)] opacity-65 transition-transform duration-500 group-hover/card:-translate-y-1 group-hover/card:-rotate-2 sm:block" />
      <span aria-hidden="true" className="absolute inset-x-3 -top-1 hidden h-16 rotate-1 rounded-[22px] border border-white/8 bg-[var(--surface)] opacity-80 transition-transform duration-500 group-hover/card:-translate-y-0.5 group-hover/card:rotate-2 sm:block" />

      <div className="relative z-10 overflow-hidden rounded-[20px] border border-[var(--album-border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,.32)] transition-colors duration-500 group-hover/card:border-[var(--brand-gold)] sm:rounded-[24px]">
        {onOpen ? (
          <button type="button" onClick={onOpen} disabled={!available} className="relative block aspect-[4/5] w-full overflow-hidden bg-[var(--surface-raised)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Xem album ${album.title}`}>{media}</button>
        ) : (
          <Link href={detailHref} aria-label={`Xem album ${album.title}`} className="relative block aspect-[4/5] w-full overflow-hidden bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-gold)]">{media}</Link>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-white/10" /><Sparkles size={14} className="text-[var(--brand-gold-soft)]" /><span className="h-px flex-1 bg-white/10" /></div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[.2em] text-[var(--brand-gold)]">{category}</p>
          <h2 className="mt-2 line-clamp-2 text-[clamp(1.75rem,5vw,2.5rem)] font-bold uppercase leading-[1.08] tracking-[-.025em] text-[var(--foreground)]">{album.title}</h2>
          {description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{description}</p>}

          {album.tags.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{album.tags.map((tag) => <span key={tag} className="inline-flex min-h-8 items-center rounded-full border border-[var(--album-border)] bg-[var(--surface-raised)] px-3 text-xs font-semibold text-[var(--brand-gold-soft)]"><Sparkles className="mr-1.5" size={11} aria-hidden="true" />{tag}</span>)}</div>}
          {imageCount > 0 && <p className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Sparkles size={15} className="text-[var(--brand-gold)]" aria-hidden="true" />{imageCount} ảnh tuyển chọn</p>}

          <div className="mt-6 grid gap-3 min-[420px]:grid-cols-2">
            {onOpen ? <button type="button" onClick={onOpen} disabled={!available} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--background)] transition-colors hover:bg-[var(--brand-gold-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"><Eye size={18} aria-hidden="true" />Xem bộ ảnh</button> : <Link href={detailHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--background)] transition-colors hover:bg-[var(--brand-gold-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"><Eye size={18} aria-hidden="true" />Xem bộ ảnh</Link>}
            {onConsult ? <button type="button" onClick={onConsult} disabled={!available} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--album-border)] bg-transparent px-4 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-50">Tư vấn <ArrowUpRight size={18} aria-hidden="true" /></button> : <Link href={consultHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--album-border)] bg-transparent px-4 text-sm font-bold text-[var(--foreground)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]">Tư vấn <ArrowUpRight size={18} aria-hidden="true" /></Link>}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ConceptAlbumCardSkeleton() {
  return <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[var(--surface)] sm:rounded-[24px]" aria-hidden="true"><div className="aspect-[4/5] animate-pulse bg-white/[.06]" /><div className="space-y-4 p-5 sm:p-6"><div className="h-3 w-24 animate-pulse rounded bg-white/[.08]" /><div className="h-9 w-4/5 animate-pulse rounded bg-white/[.08]" /><div className="h-4 w-full animate-pulse rounded bg-white/[.06]" /><div className="grid grid-cols-2 gap-3 pt-3"><div className="h-12 animate-pulse rounded bg-white/[.08]" /><div className="h-12 animate-pulse rounded bg-white/[.06]" /></div></div></div>;
}
