export default function TloraCmsLoading() {
  return (
    <main className="min-h-screen bg-[#07080a] p-5 text-[#f8f5ee] lg:p-7">
      <div className="animate-pulse">
        <div className="h-3 w-32 rounded bg-[#d8b766]/30" />
        <div className="mt-4 h-8 w-64 rounded bg-white/10" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-white/[.06]" />
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 rounded-xl border border-[#2a2722] bg-[#101115]" />
          ))}
        </div>
      </div>
    </main>
  );
}
