"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

export type TlEcosystemBranch = {
  name: string;
  label: string;
  description: string;
  image: string;
  imagePosition: string;
  logo: string;
  services: string[];
  introTitle: string;
  introText: string;
  products: Array<{ name: string; label: string }>;
  suggestions: string[];
};

type Props = {
  eyebrow: string;
  title: string;
  branches: TlEcosystemBranch[];
  initialIndex?: number;
};

export function TlEcosystemExperience({ eyebrow, title, branches, initialIndex = 0 }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [logoOverrides, setLogoOverrides] = useState<Record<number, string>>({});
  const bannerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const introLogoRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const active = branches[selectedIndex] ?? branches[0];

  useEffect(() => {
    function handleCmsImageChange(event: Event) {
      const detail = (event as CustomEvent<{ sectionKey?: string; field?: string; value?: string }>).detail;
      if (detail?.sectionKey !== "services" || !detail.value) return;
      const match = detail.field?.match(/^images\.ecosystemPage\.branch\.(\d+)\.logo$/);
      if (!match) return;
      setLogoOverrides((current) => ({ ...current, [Number(match[1])]: detail.value! }));
    }
    window.addEventListener("tlora:cms-image-change", handleCmsImageChange);
    return () => window.removeEventListener("tlora:cms-image-change", handleCmsImageChange);
  }, []);

  function flyLogoToIntroduction(index: number, sourceLogo: HTMLElement) {
    const targetLogo = introLogoRef.current;
    const content = contentRef.current;
    if (!targetLogo || !content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sourceRect = sourceLogo.getBoundingClientRect();
    const targetRect = targetLogo.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const finalTop = targetRect.top - contentRect.top + 72;
    const deltaX = targetRect.left - sourceRect.left;
    const deltaY = finalTop - sourceRect.top;
    const scaleX = targetRect.width / sourceRect.width;
    const scaleY = targetRect.height / sourceRect.height;
    const flyer = document.createElement("div");
    const flyerImage = document.createElement("img");

    flyer.className = "tl-ecosystem-logo-flight";
    Object.assign(flyer.style, {
      left: `${sourceRect.left}px`,
      top: `${sourceRect.top}px`,
      width: `${sourceRect.width}px`,
      height: `${sourceRect.height}px`,
    });
    const sourceImage = sourceLogo.querySelector<HTMLImageElement>("img");
    flyerImage.src = sourceImage?.dataset.cmsImageUrl || sourceImage?.currentSrc || sourceImage?.src || logoOverrides[index] || branches[index].logo;
    flyerImage.alt = "";
    flyer.appendChild(flyerImage);
    document.body.appendChild(flyer);
    sourceLogo.style.opacity = "0";
    targetLogo.style.opacity = "0";

    const animation = flyer.animate([
      { offset: 0, transform: "translate3d(0,0,0) scale(1)", opacity: 1, filter: "blur(0)" },
      { offset: .42, transform: `translate3d(${deltaX * .42}px,${deltaY * .3}px,0) scale(.82)`, opacity: 1, filter: "blur(0)" },
      { offset: .78, transform: `translate3d(${deltaX * .78}px,${deltaY * .72}px,0) scale(${(scaleX + .82) / 2},${(scaleY + .82) / 2})`, opacity: .96, filter: "blur(.3px)" },
      { offset: 1, transform: `translate3d(${deltaX}px,${deltaY}px,0) scale(${scaleX},${scaleY})`, opacity: 1, filter: "blur(0)" },
    ], { duration: 1050, easing: "cubic-bezier(.22,.8,.2,1)", fill: "forwards" });

    animation.finished.finally(() => {
      flyer.remove();
      sourceLogo.style.opacity = "";
      targetLogo.style.opacity = "";
      targetLogo.animate([
        { opacity: 0, transform: "translateY(-8px) scale(.94)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ], { duration: 480, easing: "cubic-bezier(.22,.8,.2,1)" });
    });
  }

  function openBranch(index: number, sourceLogo?: HTMLElement | null) {
    if (didSwipe.current) return;
    setSelectedIndex(index);
    if (sourceLogo) flyLogoToIntroduction(index, sourceLogo);
    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function cycleBranch(direction: -1 | 1) {
    setSelectedIndex((current) => (current + direction + branches.length) % branches.length);
  }

  function carouselPosition(index: number) {
    const offset = (index - selectedIndex + branches.length) % branches.length;
    if (offset === 0) return "center";
    return offset === 1 ? "right" : "left";
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
    didSwipe.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 36) return;
    didSwipe.current = true;
    cycleBranch(distance < 0 ? 1 : -1);
    window.setTimeout(() => { didSwipe.current = false; }, 0);
  }

  return (
    <>
      <section ref={bannerRef} className="relative flex min-h-[92svh] scroll-mt-20 items-start overflow-hidden px-5 pb-8 pt-12 sm:min-h-[94svh] sm:px-8 sm:pt-16 lg:px-10 lg:pt-20">
        <div className="absolute inset-0" aria-hidden="true">
          {branches.map((branch, index) => (
            <div key={branch.name} className={`absolute inset-0 transition-[opacity,transform] duration-1000 ease-out ${selectedIndex === index ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}>
              <Image src={branch.image} alt="" fill priority={index === initialIndex} sizes="100vw" className="tl-ecosystem-hero-image object-cover" style={{ objectPosition: branch.imagePosition, animationDelay: `${index * -2.5}s` }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[#07080a]/60" />
        <div className="absolute inset-0 bg-linear-to-t from-[#07080a] via-[#07080a]/22 to-[#07080a]/48" />
        <div aria-hidden="true" className="tl-ecosystem-scan absolute inset-0" />

        <div className="relative mx-auto w-full max-w-7xl">
          <p data-cms-section="services" data-cms-field="text.ecosystemPage.eyebrow" className="home-eyebrow uppercase">{eyebrow}</p>
          <h1 data-cms-section="services" data-cms-field="text.ecosystemPage.title" className="home-editorial-title mt-4 whitespace-nowrap text-[clamp(2rem,8.6vw,8rem)] uppercase leading-[.9] tracking-[-.055em]">
            {title}
          </h1>
          <div className="mt-5 flex items-center justify-between gap-5 border-t border-white/20 pt-4 sm:mt-7">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 sm:text-xs">Vuốt để chọn · Lĩnh vực ở giữa là chủ thể</p>
            <ArrowDown size={17} className="shrink-0 text-[var(--home-accent-gold-light)]" aria-hidden="true" />
          </div>

          <div
            className="tl-ecosystem-orbit relative -mx-5 mt-2 h-[270px] touch-pan-y select-none overflow-hidden sm:-mx-8 sm:h-[292px] lg:mx-0 lg:h-[310px]"
            role="region"
            aria-label="Chọn lĩnh vực trong hệ sinh thái TL"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { pointerStartX.current = null; }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") cycleBranch(-1);
              if (event.key === "ArrowRight") cycleBranch(1);
              if (event.key === "Enter") openBranch(selectedIndex);
            }}
          >
            {branches.map((branch, index) => {
              const position = carouselPosition(index);
              const selected = position === "center";
              return (
                <button
                  key={branch.name}
                  type="button"
                  onClick={(event: MouseEvent<HTMLButtonElement>) => {
                    if (didSwipe.current) return;
                    if (selected) openBranch(index, event.currentTarget.querySelector<HTMLElement>("[data-ecosystem-card-logo]"));
                    else setSelectedIndex(index);
                  }}
                  aria-pressed={selected}
                  data-position={position}
                  className="tl-ecosystem-orbit-card group absolute top-3 text-left"
                >
                  <div data-cms-image-host className="tl-ecosystem-orbit-frame relative overflow-hidden rounded-xl border border-white/15 bg-[#101115]/86 px-5 pb-5 pt-4 backdrop-blur-xl sm:px-6 sm:pb-6">
                    <div className="tl-ecosystem-frame-light absolute inset-0" aria-hidden="true" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div data-ecosystem-card-logo className="tl-ecosystem-logo relative h-16 w-44 overflow-visible transition-opacity sm:h-[72px] sm:w-52">
                        <Image data-cms-section="services" data-cms-field={`images.ecosystemPage.branch.${index}.logo`} data-cms-image-url={logoOverrides[index] || branch.logo} src={logoOverrides[index] || branch.logo} alt={`Logo ${branch.name}`} fill sizes="208px" className="scale-[1.12] object-contain object-left" />
                      </div>
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full border transition ${selected ? "border-[#dfbb63] bg-[#dfbb63] text-black" : "border-white/20 text-white/65"}`}><ArrowRight size={14} /></span>
                    </div>
                    <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${index}.name`} className="relative mt-5 text-xl font-black uppercase tracking-[-.03em] text-white sm:text-2xl">{branch.name}</p>
                    <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${index}.label`} className="mt-1 text-[9px] font-bold uppercase tracking-[.16em] text-white/50">{branch.label}</p>
                    <p className={`mt-3 line-clamp-2 text-xs leading-5 text-white/58 transition duration-500 ${selected ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>{branch.description}</p>
                  </div>
                </button>
              );
            })}
            <div className="tl-ecosystem-pedestal absolute inset-x-[12%] bottom-7 z-[5] h-12 sm:inset-x-[20%] lg:inset-x-[27%]" aria-hidden="true" />
            <button type="button" onClick={() => cycleBranch(-1)} aria-label="Lĩnh vực trước" className="absolute bottom-1 left-5 z-30 grid size-9 place-items-center rounded-full border border-white/15 bg-black/35 text-white/70 backdrop-blur-md transition hover:border-[#dfbb63]/60 hover:text-[#dfbb63]"><ChevronLeft size={17} /></button>
            <button type="button" onClick={() => cycleBranch(1)} aria-label="Lĩnh vực tiếp theo" className="absolute bottom-1 right-5 z-30 grid size-9 place-items-center rounded-full border border-white/15 bg-black/35 text-white/70 backdrop-blur-md transition hover:border-[#dfbb63]/60 hover:text-[#dfbb63]"><ChevronRight size={17} /></button>
            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
              {branches.map((branch, index) => <span key={branch.name} className={`h-1 rounded-full transition-all duration-500 ${index === selectedIndex ? "w-6 bg-[#dfbb63]" : "w-1 bg-white/30"}`} />)}
            </div>
          </div>
        </div>
      </section>

      <section ref={contentRef} id="linh-vuc" className="scroll-mt-16 bg-[var(--home-background-secondary)]">
        <div key={active.name} className="tl-ecosystem-content">
          <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16">
              <div className="relative order-2 aspect-[4/5] overflow-hidden rounded-xl border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,.42)] sm:aspect-[16/11] lg:order-1 lg:aspect-[4/5]">
                <Image data-cms-section="services" data-cms-field={`images.ecosystemPage.branch.${selectedIndex}.image`} data-cms-image-url={active.image} src={active.image} alt={active.name} fill sizes="(min-width:1024px) 48vw, 94vw" className="tl-ecosystem-panel-image object-cover" style={{ objectPosition: active.imagePosition }} />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/15" />
                <div className="tl-ecosystem-shine absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <p className="home-eyebrow">0{selectedIndex + 1} · {active.label}</p>
                  <p className="mt-2 text-3xl font-black uppercase tracking-[-.04em] text-white sm:text-5xl">{active.name}</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="home-eyebrow">GIỚI THIỆU</p>
                <h2 data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${selectedIndex}.introTitle`} className="home-editorial-title mt-4 max-w-[10ch] text-[clamp(2.7rem,9vw,6rem)] uppercase leading-[.92]">{active.introTitle}</h2>
                <div ref={introLogoRef} data-cms-image-host className="tl-ecosystem-intro-logo relative mt-7 h-20 w-56 overflow-visible sm:h-24 sm:w-72">
                  <Image data-cms-section="services" data-cms-field={`images.ecosystemPage.branch.${selectedIndex}.logo`} data-cms-image-url={logoOverrides[selectedIndex] || active.logo} src={logoOverrides[selectedIndex] || active.logo} alt={`Logo ${active.name}`} fill sizes="288px" className="scale-[1.12] object-contain object-left" />
                </div>
                <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${selectedIndex}.description`} className="mt-7 max-w-xl text-base leading-8 text-white/68 sm:text-lg">{active.description}</p>
                <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${selectedIndex}.introText`} className="mt-4 max-w-xl text-sm leading-7 text-white/48 sm:text-base">{active.introText}</p>
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-end justify-between gap-5">
                <div><p className="home-eyebrow">CHUYÊN MÔN</p><h2 className="home-editorial-title mt-3 text-4xl uppercase sm:text-6xl">DỊCH VỤ</h2></div>
                <span className="hidden text-xs font-bold uppercase tracking-[.2em] text-white/35 sm:block">{active.name}</span>
              </div>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {active.services.map((service, index) => (
                  <div key={service} className="group flex items-center justify-between gap-5 py-5 sm:py-6">
                    <div className="flex items-center gap-4 sm:gap-7"><span className="text-[10px] font-bold text-[#dfbb63]">0{index + 1}</span><h3 data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${selectedIndex}.service.${index}`} className="text-xl font-bold uppercase tracking-[-.025em] text-white sm:text-3xl">{service}</h3></div>
                    <ArrowRight className="text-white/35 transition group-hover:translate-x-1 group-hover:text-[#dfbb63]" size={18} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <p className="home-eyebrow">LỰA CHỌN NỔI BẬT</p>
              <h2 className="home-editorial-title mt-3 text-4xl uppercase sm:text-6xl">SẢN PHẨM</h2>
              <div className="mt-9 grid gap-3 md:grid-cols-3">
                {active.products.map((product, index) => (
                  <article key={product.name} className="group min-h-52 rounded-xl border border-white/10 bg-white/[.025] p-6 transition duration-500 hover:-translate-y-1 hover:border-[#dfbb63]/35 hover:bg-white/[.045] sm:min-h-64 sm:p-8">
                    <Sparkles size={17} className="text-[#dfbb63]" />
                    <p className="mt-12 text-[10px] font-bold uppercase tracking-[.18em] text-white/38">0{index + 1} · {active.name}</p>
                    <h3 data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${selectedIndex}.product.${index}.name`} className="mt-3 text-2xl font-black uppercase tracking-[-.03em] text-white">{product.name}</h3>
                    <p data-cms-section="services" data-cms-field={`text.ecosystemPage.branch.${selectedIndex}.product.${index}.label`} className="mt-2 text-sm leading-6 text-white/48">{product.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <p className="home-eyebrow">KHÁM PHÁ THÊM</p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {active.suggestions.map((item) => <span key={item} className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[.1em] text-white/70">{item}</span>)}
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/bang-gia" className="home-button-primary justify-center px-7">NHẬN TƯ VẤN <ArrowRight size={17} /></Link>
                <button type="button" onClick={() => bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-7 text-xs font-bold uppercase tracking-[.12em] text-white transition hover:border-white/35">
                  <ArrowLeft size={16} /> CHỌN LĨNH VỰC KHÁC
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
