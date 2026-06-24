import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const themeFiles = {
  wedding: ["wedding", "luxury-wedding-studio.html"],
  concept: ["concept", "tlora-concept-studio.html"],
} as const;

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function themeResponse(studioSlug: string, page = "home") {
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("display_name,status,settings").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) return new NextResponse("Not found", { status: 404 });

  const theme = studio.settings?.theme === "wedding" ? "wedding" : "concept";
  const [folder, file] = themeFiles[theme];
  const source = await readFile(path.join(process.cwd(), "src", "studio-themes", folder, file), "utf8");
  const branding = safeJson({
    name: studio.display_name,
    phone: studio.settings?.phone || "",
    email: studio.settings?.email || "",
    address: studio.settings?.address || "",
    facebook: studio.settings?.facebook_url || "",
    zalo: studio.settings?.zalo_phone || "",
    logo: studio.settings?.logo_url || "",
    primary: studio.settings?.primary_color || "",
    accent: studio.settings?.accent_color || "",
  });

  const pageValue = safeJson(page);
  const contentValue = safeJson(studio.settings?.site_content || {});
  const bridge = `<style id="tlora-theme-overrides">:root{--tlora-primary:var(--gold);}${studio.settings?.primary_color ? `body{--bg:${studio.settings.primary_color};}` : ""}${studio.settings?.accent_color ? `:root{--gold:${studio.settings.accent_color};}` : ""}.logo img,.footer-logo img{display:block;max-height:46px;max-width:190px;width:auto;object-fit:contain}.footer-logo img{max-height:36px}</style><script>window.__TLORA_STUDIO__=${branding};window.__TLORA_PAGE__=${pageValue};document.addEventListener('DOMContentLoaded',function(){var s=window.__TLORA_STUDIO__,page=window.__TLORA_PAGE__;document.title=s.name;function putLogo(el){var image=document.createElement('img');image.src=s.logo;image.alt=s.name;el.replaceChildren(image)}var logo=document.querySelector('.logo');if(s.logo&&logo){putLogo(logo);logo.setAttribute('aria-label',s.name)}else{document.querySelectorAll('.logo-title,.logo-sub,.logo').forEach(function(el){if(el.classList.contains('logo')&&el.querySelector('.logo-mark')){el.lastChild.textContent=' '+s.name}else if(el.classList.contains('logo-title')){el.textContent=s.name}else if(el.classList.contains('logo-sub')){el.textContent='Studio'}})}document.querySelectorAll('.footer-logo').forEach(function(el){if(s.logo){putLogo(el)}else{el.textContent=s.name}});var contacts=[s.address,s.phone,s.email];document.querySelectorAll('.footer-contact-item').forEach(function(el,i){var value=contacts[i],text=el.querySelector('span:last-child');if(value&&text)text.textContent=value});document.querySelectorAll('a').forEach(function(el){var label=(el.title||el.textContent||'').toLowerCase();if(s.facebook&&label.includes('facebook'))el.href=s.facebook;if(s.zalo&&label.includes('zalo'))el.href='https://zalo.me/'+s.zalo.replace(/[^0-9]/g,'')});var pages=['home','gioi-thieu','album','dich-vu','bang-gia','lien-he'];document.querySelectorAll('nav a,.mobile-menu a,#mobile-menu a').forEach(function(el,i){var target=pages[i%pages.length];el.href=target==='home'?'/' : '/'+target;el.addEventListener('click',function(e){e.preventDefault();window.top.location.href=el.href})});if(page!=='home'){var map={'gioi-thieu':['.about'],'album':['#gallery','.gallery'], 'dich-vu':['.services','#showreel','#process'], 'bang-gia':['.pricing','#pricing'], 'lien-he':['.cta-banner','#cta-final','footer']};var keep=map[page]||[];document.querySelectorAll('section,.marquee-section').forEach(function(el){if(!keep.some(function(selector){return el.matches(selector)||el.querySelector(selector)}))el.style.display='none'});window.scrollTo(0,0)}});</script>`;
  const contentBridge = `<script>document.addEventListener('DOMContentLoaded',function(){var c=${contentValue};function set(selector,value){var e=document.querySelector(selector);if(e&&value)e.textContent=value}function pic(selector,value){var e=document.querySelector(selector);if(e&&value){if(e.tagName==='IMG')e.src=value;else e.style.backgroundImage='url('+value+')'}}if(c.hero){set('.hero-title,.hero-h1',c.hero.title);set('.hero-desc,.hero-sub',c.hero.description);set('.btn-primary',c.hero.cta);pic('.hero-bg-image',c.hero.image)}if(c.about){set('.about .section-title',c.about.title);set('.about .section-body',c.about.description);pic('.about-image img,.about-image',c.about.image)}function cards(items,selector){if(!Array.isArray(items))return;document.querySelectorAll(selector).forEach(function(card,i){var x=items[i];if(!x)return;setCard(card,'.service-name,.concept-name,.pricing-tier',x.title);setCard(card,'.service-cat,.concept-cat',x.subtitle);setCard(card,'.pricing-price,.bento-price',x.price);setCard(card,'.pricing-body p',x.description);var im=card.querySelector('img');if(im&&x.image)im.src=x.image})}function setCard(card,selector,value){var e=card.querySelector(selector);if(e&&value)e.textContent=value}cards(c.services,'.service-card,.concept-card');cards(c.pricing,'.pricing-card');cards(c.gallery,'.gallery-item,.masonry-item')});</script>`;
  const subpageBridge = `<script>document.addEventListener('DOMContentLoaded',function(){if(window.__TLORA_PAGE__==='home')return;var header=document.querySelector('#header,header');if(header){header.classList.add('scrolled');header.style.background=header.id==='header'?'rgba(13,13,13,.96)':'rgba(255,255,255,.97)';header.style.boxShadow='0 1px 12px rgba(0,0,0,.12)'}var first=document.querySelector('section:not([style*="display: none"])');if(first)first.style.paddingTop='130px'})</script>`;
  const html = source.replace("</head>", `${bridge}${contentBridge}${subpageBridge}</head>`);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN" } });
}

export async function GET(_: Request, { params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  return themeResponse(studioSlug);
}
