import { ConceptAlbumCardSkeleton } from "@/components/public/concept-album-card";

export default function ConceptAlbumsLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-16 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="h-3 w-40 animate-pulse rounded bg-white/[.08]" />
        <div className="mt-5 h-14 max-w-3xl animate-pulse rounded bg-white/[.08]" />
        <div className="mt-5 h-5 max-w-xl animate-pulse rounded bg-white/[.06]" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <ConceptAlbumCardSkeleton key={index} />)}
        </div>
      </div>
    </main>
  );
}
