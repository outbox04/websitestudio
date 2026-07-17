"use client";

import { MoveHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Children, useEffect, useRef } from "react";

export function MobileCarousel({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemCount = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;

    const updateActiveCard = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        const cards = Array.from(track.children) as HTMLElement[];
        let active: HTMLElement | undefined;
        let closest = Number.POSITIVE_INFINITY;
        for (const card of cards) {
          const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (distance < closest) {
            closest = distance;
            active = card;
          }
        }
        for (const card of cards) card.dataset.carouselActive = String(card === active);
      });
    };

    updateActiveCard();
    track.addEventListener("scroll", updateActiveCard, { passive: true });
    window.addEventListener("resize", updateActiveCard);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", updateActiveCard);
      window.removeEventListener("resize", updateActiveCard);
    };
  }, [children]);

  return (
    <div>
      {itemCount > 1 && <p className="home-swipe-hint" aria-hidden="true"><MoveHorizontal size={16} /> Vuốt để xem thêm</p>}
      <div ref={trackRef} className={`home-mobile-carousel ${className}`} role="region" aria-roledescription="carousel" aria-label={label}>{children}</div>
    </div>
  );
}
