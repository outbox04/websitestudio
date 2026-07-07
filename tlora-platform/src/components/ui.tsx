import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function ButtonLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link
      className={clsx(
        "inline-flex min-h-11 items-center justify-center rounded-md bg-[#d8b766] px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-[#d8b766]/15 transition hover:bg-[#f0d58c] focus:outline-none focus:ring-2 focus:ring-[#d8b766] focus:ring-offset-2 focus:ring-offset-[#07080a]",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b766]">{eyebrow}</p>
      <h2 className="mt-3 font-heading text-3xl font-bold text-white md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-zinc-400 md:text-lg">{description}</p>
    </div>
  );
}

export function StateBox({
  title,
  description,
  tone = "neutral",
}: {
  title: string;
  description: string;
  tone?: "neutral" | "success" | "error";
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-4 text-sm shadow-xl shadow-black/20",
        tone === "success" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
        tone === "error" && "border-red-400/20 bg-red-400/10 text-red-100",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-zinc-300",
      )}
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 leading-6">{description}</p>
    </div>
  );
}
