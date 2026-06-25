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
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character); }

type UxBlock = {
  id?: string;
  type?: "section" | "columns" | "text" | "button" | "image" | "spacer";
  title?: string;
  text?: string;
  href?: string;
  image?: string;
  columns?: string[];
  style?: {
    background?: string;
    color?: string;
    align?: "left" | "center" | "right";
    padding?: number;
    gap?: number;
    radius?: number;
    fontSize?: number;
    height?: number;
  };
};

function pageKeyForTheme(page: string) {
  return page === "home" ? "trang-chu" : page;
}

function cleanCss(value: unknown) {
  return typeof value === "string" ? value.replace(/[;"<>]/g, "").slice(0, 80) : "";
}

function px(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(value, 240)) : fallback;
}

function renderStyle(style: UxBlock["style"] = {}, extra: Record<string, string | number> = {}) {
  const align = ["left", "center", "right"].includes(String(style.align)) ? style.align : undefined;
  const items: Record<string, string | number | undefined> = {
    background: cleanCss(style.background),
    color: cleanCss(style.color),
    "text-align": align,
    padding: style.padding === undefined ? undefined : `${px(style.padding)}px`,
    gap: style.gap === undefined ? undefined : `${px(style.gap)}px`,
    "border-radius": style.radius === undefined ? undefined : `${px(style.radius)}px`,
    "font-size": style.fontSize === undefined ? undefined : `${px(style.fontSize, 18)}px`,
    height: style.height === undefined ? undefined : `${px(style.height, 48)}px`,
    ...extra,
  };
  return Object.entries(items).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => `${key}:${escapeHtml(String(value))}`).join(";");
}

function renderUxBlock(block: UxBlock) {
  const style = block.style || {};
  if (block.type === "spacer") return `<div class="ux-spacer" style="${renderStyle(style)}"></div>`;
  if (block.type === "button") {
    return `<section class="ux-button-wrap" style="${renderStyle(style, { background: "transparent" })}"><a class="ux-button" href="${escapeHtml(block.href || "#")}" style="${renderStyle(style)}">${escapeHtml(block.text || "Button")}</a></section>`;
  }
  if (block.type === "image") {
    return `<section class="ux-image" style="${renderStyle(style)}"><img src="${escapeHtml(block.image || "/brand/tlora-logo.png")}" alt="${escapeHtml(block.title || "")}"></section>`;
  }
  if (block.type === "columns") {
    const columns = Array.isArray(block.columns) && block.columns.length ? block.columns : ["Column 1", "Column 2", "Column 3"];
    return `<section class="ux-columns" style="${renderStyle(style)}">${columns.map((column) => `<div class="ux-column">${escapeHtml(String(column))}</div>`).join("")}</section>`;
  }
  return `<section class="ux-section ux-${escapeHtml(block.type || "section")}" style="${renderStyle(style)}"><div class="ux-inner">${block.title ? `<h1>${escapeHtml(block.title)}</h1>` : ""}${block.text ? `<p>${escapeHtml(block.text)}</p>` : ""}</div></section>`;
}

function renderUxPage(studioSlug: string, studio: { display_name: string; settings?: Record<string, unknown> | null }, page: string, blocks: UxBlock[]) {
  const settings = studio.settings || {};
  const primary = cleanCss(settings.primary_color) || "#111111";
  const accent = cleanCss(settings.accent_color) || "#d8b766";
  const logo = typeof settings.logo_url === "string" ? settings.logo_url : "";
  const title = `${studio.display_name} - ${page === "home" ? "Trang chu" : page}`;
  const nav = [
    ["Trang chu", "/"],
    ["Gioi thieu", "/gioi-thieu"],
    ["Dich vu", "/dich-vu"],
    ["Album", "/album"],
    ["Bang gia", "/bang-gia"],
    ["Lien he", "/lien-he"],
  ];
  const customHead = String(settings.custom_head_code || "");
  const customBody = String(settings.custom_body_code || "");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="icon" href="/studio-site/${studioSlug}/favicon"><style>
    :root{--primary:${escapeHtml(primary)};--accent:${escapeHtml(accent)};--text:#141414;--muted:#696969;--line:#e6e6e6}
    *{box-sizing:border-box}body{margin:0;background:#fff;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit;text-decoration:none}
    .site-header{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.94);padding:16px clamp(18px,4vw,60px);backdrop-filter:blur(14px)}
    .brand{display:flex;align-items:center;gap:12px;font-weight:900}.brand img{max-height:42px;max-width:170px;object-fit:contain}.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:8px;background:var(--primary);color:#fff}
    nav{display:flex;flex-wrap:wrap;gap:16px;font-size:14px;font-weight:700;color:#444}main{min-height:70vh}.ux-section{padding:72px clamp(20px,5vw,86px)}.ux-inner{max-width:1080px;margin:0 auto}.ux-section h1,.ux-section h2{margin:0;font-size:clamp(34px,5vw,72px);line-height:1.02;letter-spacing:0;font-weight:900}.ux-section p{max-width:760px;margin:18px auto 0;line-height:1.75;font-size:18px}
    .ux-text h1{font-size:clamp(28px,3vw,46px)}.ux-columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));padding:44px clamp(20px,5vw,86px)}.ux-column{min-height:120px;border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 14%,transparent);border-radius:8px;padding:24px;line-height:1.65;background:rgba(255,255,255,.08)}
    .ux-button-wrap{padding:24px clamp(20px,5vw,86px)}.ux-button{display:inline-flex;min-height:46px;align-items:center;justify-content:center;padding:0 24px;font-weight:800}.ux-image{padding:36px clamp(20px,5vw,86px);text-align:center}.ux-image img{display:inline-block;max-width:100%;max-height:680px;object-fit:contain}.ux-spacer{display:block}
    footer{border-top:1px solid var(--line);padding:28px clamp(18px,4vw,60px);color:var(--muted);font-size:14px}@media(max-width:720px){.site-header{align-items:flex-start;flex-direction:column}nav{gap:10px}.ux-section{padding:48px 18px}.ux-section h1,.ux-section h2{font-size:36px}.ux-section p{font-size:16px}}
  </style>${customHead}</head><body><header class="site-header"><a class="brand" href="/">${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(studio.display_name)}">` : `<span class="brand-mark">T</span>`}<span>${escapeHtml(studio.display_name)}</span></a><nav>${nav.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}</nav></header><main>${blocks.map(renderUxBlock).join("")}</main><footer>© ${new Date().getFullYear()} ${escapeHtml(studio.display_name)}. Powered by TLORA Studio.</footer>${customBody}</body></html>`;
}

export async function themeResponse(studioSlug: string, page = "home", builder = false) {
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("display_name,status,settings").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) return new NextResponse("Not found", { status: 404 });

  const uxBlocks = studio.settings?.ux_pages?.[pageKeyForTheme(page)];
  if (Array.isArray(uxBlocks) && uxBlocks.length) {
    return new NextResponse(renderUxPage(studioSlug, studio, page, uxBlocks), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN" } });
  }

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
  const contentBridge = `<script>window.__applyTloraContent=function(c){c=c||{};function set(selector,value){var e=document.querySelector(selector);if(e&&value)e.textContent=value}function pic(selector,value){var e=document.querySelector(selector);if(e&&value){if(e.tagName==='IMG')e.src=value;else e.style.backgroundImage='url('+value+')'}}if(c.hero){set('.hero-title,.hero-h1',c.hero.title);set('.hero-desc,.hero-sub',c.hero.description);set('.btn-primary',c.hero.cta);pic('.hero-bg-image,.hero',c.hero.image)}if(c.about){set('.about .section-title',c.about.title);set('.about .section-body',c.about.description);pic('.about-image img,.about-image',c.about.image)}function cards(items,selector){if(!Array.isArray(items))return;document.querySelectorAll(selector).forEach(function(card,i){var x=items[i];if(!x)return;setCard(card,'.service-name,.concept-name,.pricing-tier,.pricing-name',x.title);setCard(card,'.service-cat,.concept-cat',x.subtitle);setCard(card,'.pricing-price,.bento-price,.pricing-amount',x.price);setCard(card,'.pricing-body p,.pricing-desc',x.description);var im=card.querySelector('img');if(im&&x.image)im.src=x.image;var bg=card.querySelector('.service-card-bg');if(bg&&x.image)bg.style.backgroundImage='url('+x.image+')'})}function setCard(card,selector,value){var e=card.querySelector(selector);if(e&&value)e.textContent=value}cards(c.services,'.service-card,.concept-card');cards(c.pricing,'.pricing-card');cards(c.gallery,'.gallery-item,.masonry-item')};document.addEventListener('DOMContentLoaded',function(){window.__applyTloraContent(${contentValue})});</script>`;
  const builderBridge = builder ? `<style id="tlora-builder-style">[data-tlora-editable]{cursor:pointer!important;outline:2px solid transparent;outline-offset:4px;transition:outline-color .15s ease}[data-tlora-editable]:hover,[data-tlora-editable].tlora-selected{outline-color:#25a9e8!important}[data-tlora-editable].tlora-selected{box-shadow:0 0 0 5px rgba(37,169,232,.2)!important}</style><script>document.addEventListener('DOMContentLoaded',function(){function mark(selector,type){document.querySelectorAll(selector).forEach(function(el,index){el.dataset.tloraEditable=type+':'+index;el.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();document.querySelectorAll('.tlora-selected').forEach(function(x){x.classList.remove('tlora-selected')});el.classList.add('tlora-selected');window.parent.postMessage({type:'tlora-builder-select',key:el.dataset.tloraEditable},window.location.origin)})})}var hero=document.querySelector('.hero');if(hero){hero.dataset.tloraEditable='hero:0';hero.addEventListener('click',function(event){if(event.target.closest('a,button'))event.preventDefault();event.stopPropagation();document.querySelectorAll('.tlora-selected').forEach(function(x){x.classList.remove('tlora-selected')});hero.classList.add('tlora-selected');window.parent.postMessage({type:'tlora-builder-select',key:'hero:0'},window.location.origin)})}mark('.about','about');mark('.service-card,.concept-card','services');mark('.pricing-card','pricing');mark('.gallery-item,.masonry-item','gallery');window.parent.postMessage({type:'tlora-builder-ready'},window.location.origin)});window.addEventListener('message',function(event){if(event.origin!==window.location.origin||!event.data)return;if(event.data.type==='tlora-builder-preview'&&window.__applyTloraContent)window.__applyTloraContent(event.data.content)})</script>` : "";
  const subpageBridge = `<script>document.addEventListener('DOMContentLoaded',function(){function pageFor(label){label=(label||'').toLowerCase();if(label.includes('trang chủ'))return '/';if(label.includes('giới thiệu')||label.includes('về chúng tôi'))return '/gioi-thieu';if(label.includes('album')||label.includes('khoảnh khắc')||label.includes('concept'))return '/album';if(label.includes('dịch vụ')||label.includes('quay phim')||label.includes('makeup')||label.includes('thuê váy'))return '/dich-vu';if(label.includes('bảng giá')||label.includes('nhận báo giá')||label.includes('đặt lịch'))return '/bang-gia';if(label.includes('cẩm nang')||label.includes('tin tức'))return '/tin-tuc';if(label.includes('liên hệ'))return '/lien-he';return null}document.querySelectorAll('nav a,.mobile-menu a,#mobile-menu a').forEach(function(el){var href=pageFor(el.textContent);if(href)el.href=href});if(window.__TLORA_PAGE__==='home')return;var header=document.querySelector('#header,header');if(header){header.classList.add('scrolled');header.style.background=header.id==='header'?'rgba(13,13,13,.96)':'rgba(255,255,255,.97)';header.style.boxShadow='0 1px 12px rgba(0,0,0,.12)'}var first=document.querySelector('section:not([style*="display: none"])');if(first)first.style.paddingTop='130px'})</script>`;
  const favicon = `<link rel="icon" href="/studio-site/${studioSlug}/favicon">`;
  const settings = studio.settings || {}; const keywords = String(settings.seo_keywords || ""); const canonical = String(settings.canonical_url || "");
  const tracking = [settings.google_analytics_id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(String(settings.google_analytics_id))}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${String(settings.google_analytics_id).replace(/'/g, "\\'")}');</script>` : "", settings.facebook_pixel_id ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${String(settings.facebook_pixel_id).replace(/'/g, "\\'")}');fbq('track','PageView');</script>` : ""].join("");
  const head = `<meta name="keywords" content="${escapeHtml(keywords)}">${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ""}${tracking}${String(settings.custom_head_code || "")}`;
  const bodyCode = String(settings.custom_body_code || ""); const body = settings.defer_non_critical ? `<script>window.addEventListener('load',function(){${bodyCode}})</script>` : bodyCode;
  const html = source.replace("</head>", `${favicon}${head}${bridge}${contentBridge}${subpageBridge}${builderBridge}</head>`).replace("</body>", `${body}</body>`);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  return themeResponse(studioSlug, "home", new URL(request.url).searchParams.get("builder") === "1");
}
