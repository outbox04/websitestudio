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
    const cards = Array.from(track.children) as HTMLElement[];
    const visibility = new Map<Element, number>();
    cards.forEach((card, index) => { card.dataset.carouselActive = String(index === 0); });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));
      const active = cards.reduce<HTMLElement | undefined>((best, card) => {
        if (!best) return card;
        return (visibility.get(card) || 0) > (visibility.get(best) || 0) ? card : best;
      }, undefined);
      cards.forEach((card) => { card.dataset.carouselActive = String(card === active); });
    }, { root: track, threshold: [0.25, 0.5, 0.75, 1] });

    cards.forEach((card) => observer.observe(card));
    return () => {
      observer.disconnect();
      visibility.clear();
    };
  }, [children]);

  return (
    <div>
      {itemCount > 1 && <p className="home-swipe-hint" aria-hidden="true"><MoveHorizontal size={16} /> Vuốt để xem thêm</p>}
      <div ref={trackRef} className={`home-mobile-carousel ${className}`} role="region" aria-roledescription="carousel" aria-label={label}>{children}</div>
    </div>
  );
}
