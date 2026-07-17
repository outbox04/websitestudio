"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HomeStickyCta({ bookingHref }: { bookingHref: string }) {
  const [pastHero, setPastHero] = useState(false);
  const [nearPageEnd, setNearPageEnd] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("#home-hero");
    const finalCta = document.querySelector("#home-final-cta");
    const footer = document.querySelector("footer");
    if (!hero || !finalCta) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0.08 },
    );
    const endObserver = new IntersectionObserver(
      (entries) => setNearPageEnd(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "120px 0px 120px" },
    );

    heroObserver.observe(hero);
    endObserver.observe(finalCta);
    if (footer) endObserver.observe(footer);

    return () => {
      heroObserver.disconnect();
      endObserver.disconnect();
    };
  }, []);

  return (
    <aside
      aria-label="Liên hệ nhanh"
      className={`home-sticky-cta fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))] transition duration-[var(--motion-normal)] lg:hidden ${
        pastHero && !nearPageEnd ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto grid max-w-md grid-cols-[0.82fr_1.18fr] gap-2 rounded-[18px] border border-white/10 bg-[#08090b]/88 p-2 shadow-2xl shadow-black/45 backdrop-blur-xl">
        <Link href="#mood" className="home-button-secondary min-h-12 px-3">
          <MessageCircle size={17} aria-hidden="true" />
          Tư vấn
        </Link>
        <Link href={bookingHref} className="home-button-primary min-h-12 px-4">
          Đặt lịch
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
