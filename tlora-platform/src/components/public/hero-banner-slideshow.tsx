"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export const heroSlidesPreviewEvent = "tlora:cms-hero-slides";

function cleanSlides(values: unknown, fallback: string) {
  const slides = Array.isArray(values) ? values.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [];
  return slides.length ? slides : fallback ? [fallback] : [];
}

export function HeroBannerSlideshow({ initialSlides, fallbackImage, imagePosition }: { initialSlides: string[]; fallbackImage: string; imagePosition: string }) {
  const [slides, setSlides] = useState(() => cleanSlides(initialSlides, fallbackImage));
  const [position, setPosition] = useState(imagePosition);
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondarySlidesReady, setSecondarySlidesReady] = useState(false);

  useEffect(() => {
    const revealSecondarySlides = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => setSecondarySlidesReady(true), { timeout: 1500 });
      } else {
        setTimeout(() => setSecondarySlidesReady(true), 1);
      }
    };

    if (document.readyState === "complete") revealSecondarySlides();
    else window.addEventListener("load", revealSecondarySlides, { once: true });
    return () => window.removeEventListener("load", revealSecondarySlides);
  }, []);

  useEffect(() => {
    const handlePreview = (event: Event) => {
      const detail = (event as CustomEvent<{ slides?: unknown; fallbackImage?: string; imagePosition?: string }>).detail;
      setSlides(cleanSlides(detail?.slides, detail?.fallbackImage || fallbackImage));
      if (detail?.imagePosition) setPosition(detail.imagePosition);
      setActiveIndex(0);
      setSecondarySlidesReady(true);
    };
    window.addEventListener(heroSlidesPreviewEvent, handlePreview);
    return () => window.removeEventListener(heroSlidesPreviewEvent, handlePreview);
  }, [fallbackImage]);

  useEffect(() => {
    if (!secondarySlidesReady || slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), 2000);
    return () => window.clearInterval(timer);
  }, [secondarySlidesReady, slides.length]);

  return (
    <div className="home-hero-slideshow absolute inset-0" data-cms-hero-slideshow>
      {(secondarySlidesReady ? slides : slides.slice(0, 1)).map((src, index) => (
        <Image
          key={`${src}-${index}`}
          data-cms-section="hero"
          data-cms-field="image"
          data-cms-image-url={src}
          data-cms-image-position={position}
          src={src}
          alt={index === activeIndex ? "Banner TLORA Studio" : ""}
          fill
          fetchPriority={index === 0 ? "high" : "low"}
          loading={index === 0 ? "eager" : "lazy"}
          quality={70}
          sizes="100vw"
          aria-hidden={index !== activeIndex}
          className={`home-hero-slide object-cover transition-opacity duration-700 ease-out ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ objectPosition: position }}
        />
      ))}
    </div>
  );
}
