"use client";

import { ArrowRight, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { TloraConceptAlbum } from "@/types/scope";

type ConceptAlbumCardProps = {
  album: TloraConceptAlbum;
  order: number;
  priority?: boolean;
};

export function ConceptAlbumCard({ album, order, priority = false }: ConceptAlbumCardProps) {
  const [imageError, setImageError] = useState(false);
  const available = album.status === "published";
  const detailHref = `/album-concept/${encodeURIComponent(album.slug)}`;
  const category = album.categoryName?.trim() || "Album Concept";
  const description = album.excerpt.trim();

  const content = (
    <>
      {!imageError && album.coverImageUrl ? (
        <Image
          src={album.coverImageUrl}
          alt={`Ảnh bìa album ${album.title}`}
          fill
          fetchPriority={priority ? "high" : "auto"}
          quality={70}
          onError={() => setImageError(true)}
          className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.035]"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 92vw"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[var(--surface-raised)] text-[var(--muted)]">
          <span className="text-center text-sm"><ImageOff className="mx-auto mb-2" aria-hidden="true" />Ảnh đang cập nhật</span>
        </span>
      )}

      <span className="absolute inset-0 bg-linear-to-t from-black/95 via-black/25 to-transparent" aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-0 z-10 p-4 text-left sm:p-5">
        <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[var(--brand-gold-soft)] sm:text-xs">{category}</span>
        <span className="mt-1.5 block line-clamp-1 text-xl font-black uppercase leading-tight tracking-[-.02em] text-white sm:text-2xl">{album.title}</span>
        <span className="mt-1.5 flex items-end justify-between gap-4">
          <span className="line-clamp-2 min-w-0 text-xs leading-5 text-white/75 sm:text-sm">{description || "Khám phá trọn bộ concept và câu chuyện hình ảnh."}</span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[var(--brand-gold-soft)] sm:text-sm">Xem album <ArrowRight size={16} aria-hidden="true" /></span>
        </span>
      </span>
    </>
  );

  return (
    <article className="group/card relative aspect-video overflow-hidden rounded-[20px] border border-[var(--album-border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,.3)] opacity-100 transition-[transform,border-color] duration-500 ease-out [animation:concept-card_.55s_ease-out_forwards] hover:-translate-y-1 hover:border-[var(--brand-gold)]" style={{ animationDelay: `${((order - 1) % 15) * 55}ms` }}>
      <Link href={available ? detailHref : "/album-concept"} aria-disabled={!available} aria-label={`Xem album ${album.title}`} className={`relative block size-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-gold)] ${available ? "" : "pointer-events-none opacity-60"}`}>{content}</Link>
    </article>
  );
}

export function ConceptAlbumCardSkeleton() {
  return <div className="aspect-video animate-pulse overflow-hidden rounded-[20px] border border-white/10 bg-white/[.06]" aria-hidden="true" />;
}
