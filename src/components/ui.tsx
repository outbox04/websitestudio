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
        "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
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
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-zinc-950 md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-zinc-600 md:text-lg">{description}</p>
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
        "rounded-md border p-4 text-sm",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "error" && "border-red-200 bg-red-50 text-red-800",
        tone === "neutral" && "border-zinc-200 bg-white text-zinc-600",
      )}
    >
      <p className="font-semibold text-zinc-950">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}
