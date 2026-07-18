"use client";

import { useEffect } from "react";

/** Attaches scroll-reveal + scroll-progress bar behaviour.
 *  No logic is changed anywhere else — this is purely visual. */
export function HomeCinematic() {
  useEffect(() => {
    // ── Scroll-progress bar ───────────────────────────────────────
    const bar = document.getElementById("home-scroll-progress");
    const updateProgress = () => {
      if (!bar) return;
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    // ── Scroll-reveal (IntersectionObserver) ─────────────────────
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], .home-img-reveal"));
    if (!revealEls.length) return () => { window.removeEventListener("scroll", updateProgress); };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealDelay ?? "0";
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("is-revealed");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", updateProgress);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      id="home-scroll-progress"
      aria-hidden="true"
      className="home-scroll-progress"
    />
  );
}
