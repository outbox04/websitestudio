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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

const mojibakePattern = /(?:Ã|Â|Ä|Å|Æ|áº|á»|â€|à¸|à¹)/;
const windows1252Bytes: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e,
  "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

function windows1252Byte(character: string) {
  return windows1252Bytes[character] ?? (character.charCodeAt(0) <= 0xff ? character.charCodeAt(0) : undefined);
}

function fixMojibake(value: string) {
  let current = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!mojibakePattern.test(current)) return current;
    const bytes = Array.from(current, windows1252Byte);
    if (bytes.some((byte) => byte === undefined)) return current;
    try {
      const decoded = new TextDecoder("utf-8", { fatal: false }).decode(Uint8Array.from(bytes as number[]));
      if (decoded.includes("�") || decoded === current) return current;
      current = decoded;
    } catch {
      return current;
    }
  }
  return current;
}

function fixMojibakeDeep(value: unknown): unknown {
  if (typeof value === "string") return fixMojibake(value);
  if (Array.isArray(value)) return value.map(fixMojibakeDeep);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fixMojibakeDeep(item)]));
  return value;
}

function themeOverrideStyle(settings: Record<string, unknown>) {
  return `<style id="tlora-theme-overrides">:root{--tlora-primary:var(--gold);}${settings.primary_color ? `body{--bg:${String(settings.primary_color)};}` : ""}${settings.accent_color ? `:root{--gold:${String(settings.accent_color)};}` : ""}.logo img,.footer-logo img{display:block;max-height:46px;max-width:190px;width:auto;object-fit:contain}.footer-logo img{max-height:36px}</style>`;
}

function studioBridge(branding: string, pageValue: string) {
  return `<script>
window.__TLORA_STUDIO__=${branding};
window.__TLORA_PAGE__=${pageValue};
window.__applyTloraBranding=function(s){
  s=s||window.__TLORA_STUDIO__||{};
  window.__TLORA_STUDIO__=Object.assign({},window.__TLORA_STUDIO__||{},s);
  document.title=s.name||document.title;
  function putLogo(el){var image=document.createElement('img');image.src=s.logo;image.alt=s.name||'Studio';el.replaceChildren(image)}
  var logo=document.querySelector('.logo');
  if(s.logo&&logo){putLogo(logo);logo.setAttribute('aria-label',s.name||'Studio')}
  else{document.querySelectorAll('.logo-title,.logo-sub,.logo').forEach(function(el){if(el.classList.contains('logo')&&el.querySelector('.logo-mark')){el.lastChild.textContent=' '+(s.name||'Studio')}else if(el.classList.contains('logo-title')){el.textContent=s.name||'Studio'}else if(el.classList.contains('logo-sub')){el.textContent='Studio'}})}
  document.querySelectorAll('.footer-logo').forEach(function(el){if(s.logo){putLogo(el)}else{el.textContent=s.name||'Studio'}});
  var contacts=[s.address,s.phone,s.email,s.facebook];
  document.querySelectorAll('.footer-contact-item').forEach(function(el,i){var value=contacts[i],text=el.querySelector('span:last-child')||el;if(value&&text)text.textContent=value});
  document.querySelectorAll('a').forEach(function(el){var label=(el.title||el.textContent||'').toLowerCase();if(s.facebook&&label.includes('facebook'))el.href=s.facebook;if(s.zalo&&label.includes('zalo'))el.href='https://zalo.me/'+String(s.zalo).replace(/[^0-9]/g,'')});
};
document.addEventListener('DOMContentLoaded',function(){
  window.__applyTloraBranding(window.__TLORA_STUDIO__);
  var page=window.__TLORA_PAGE__;
  var pages=['home','gioi-thieu','album','dich-vu','bang-gia','lien-he'];
  document.querySelectorAll('nav a,.mobile-menu a,#mobile-menu a').forEach(function(el,i){var target=pages[i%pages.length];el.href=target==='home'?'/' : '/'+target;el.addEventListener('click',function(e){e.preventDefault();window.top.location.href=el.href})});
  if(page!=='home'){var map={'gioi-thieu':['.about'],'album':['#gallery','.gallery','.portfolio'], 'dich-vu':['.services','#showreel','#process'], 'bang-gia':['.pricing','#pricing'], 'lien-he':['.cta-banner','#cta-final','footer']};var keep=map[page]||[];document.querySelectorAll('section,.marquee-section').forEach(function(el){if(!keep.some(function(selector){return el.matches(selector)||el.querySelector(selector)}))el.style.display='none'});window.scrollTo(0,0)}
});
</script>`;
}

function contentBridge(contentValue: string) {
  return `<script>
window.__applyTloraContent=function(c){
  c=c||{};
  function set(selector,value){if(!value)return;document.querySelectorAll(selector).forEach(function(e){if(document.activeElement!==e)e.textContent=value})}
  function pic(selector,value){if(!value)return;document.querySelectorAll(selector).forEach(function(e){if(e.tagName==='IMG')e.src=value;else e.style.backgroundImage='url('+value+')'})}
  function setCard(card,selector,value){if(!value)return;var e=card.querySelector(selector);if(e&&document.activeElement!==e)e.textContent=value}
  if(c.hero){set('.hero-title,.hero-h1',c.hero.title);set('.hero-desc,.hero-sub,.hero-subtitle',c.hero.description);set('.btn-primary,.nav-cta,.mobile-menu-cta',c.hero.cta);pic('.hero-bg-image,.hero-bg img,.hero',c.hero.image)}
  if(c.about){set('.about .section-title,.about-title',c.about.title);set('.about .section-body,.about-text,.about-desc,.about-quote',c.about.description);pic('.about-image img,.about-image,.about-image-frame',c.about.image)}
  function cards(items,selector){if(!Array.isArray(items))return;document.querySelectorAll(selector).forEach(function(card,i){var x=items[i];if(!x)return;setCard(card,'.service-name,.concept-name,.pricing-tier,.pricing-name,.portfolio-title',x.title);setCard(card,'.service-cat,.concept-cat,.service-subtitle',x.subtitle);setCard(card,'.pricing-price,.pricing-amount,.bento-price',x.price);setCard(card,'.pricing-body p,.pricing-desc,.service-desc,.portfolio-desc,.masonry-hover span',x.description);var im=card.querySelector('img');if(im&&x.image)im.src=x.image;var bg=card.querySelector('.service-card-bg,.gallery-image,.portfolio-image');if(bg&&x.image)bg.style.backgroundImage='url('+x.image+')'})}
  cards(c.services,'.service-card,.concept-card');
  cards(c.pricing,'.pricing-card');
  cards(c.gallery,'.gallery-item,.masonry-item,.portfolio-item');
};
document.addEventListener('DOMContentLoaded',function(){window.__applyTloraContent(${contentValue})});
</script>`;
}

function builderBridge(builder: boolean) {
  if (!builder) return "";
  return `<style id="tlora-builder-style">
[data-tlora-editable]{cursor:pointer!important;outline:2px solid transparent!important;outline-offset:4px!important;transition:outline-color .15s ease,box-shadow .15s ease!important}
[data-tlora-editable]:hover,[data-tlora-editable].tlora-selected{outline-color:#25a9e8!important}
[data-tlora-editable].tlora-selected{box-shadow:0 0 0 5px rgba(37,169,232,.22)!important}
[data-tlora-text]{cursor:text!important}
[data-tlora-text]:focus{outline-color:#25a9e8!important}
.tlora-image-wrap{position:relative!important}
.tlora-image-button{position:absolute!important;left:12px!important;bottom:12px!important;z-index:9999!important;display:inline-flex!important;min-height:36px!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(255,255,255,.4)!important;border-radius:8px!important;background:rgba(0,0,0,.78)!important;color:#fff!important;padding:0 12px!important;font:700 12px/1 Inter,Arial,sans-serif!important;box-shadow:0 8px 24px rgba(0,0,0,.28)!important;opacity:0!important;transform:translateY(4px)!important;transition:opacity .15s ease,transform .15s ease!important}
.tlora-image-wrap:hover .tlora-image-button,.tlora-image-wrap.tlora-selected .tlora-image-button{opacity:1!important;transform:translateY(0)!important}
</style><script>
document.addEventListener('DOMContentLoaded',function(){
  function select(el,key){document.querySelectorAll('.tlora-selected').forEach(function(x){x.classList.remove('tlora-selected')});el.classList.add('tlora-selected');window.parent.postMessage({type:'tlora-builder-select',key:key},window.location.origin)}
  function mark(selector,type){document.querySelectorAll(selector).forEach(function(el,index){var key=type+':'+index;el.dataset.tloraEditable=key;el.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();select(el,key)})})}
  function wireText(el,key,field){if(!el)return;el.dataset.tloraEditable=key;el.dataset.tloraText=field;el.contentEditable='true';el.spellcheck=false;el.addEventListener('click',function(event){event.stopPropagation();select(el,key)});el.addEventListener('input',function(){window.parent.postMessage({type:'tlora-builder-edit',key:key,field:field,value:el.textContent||''},window.location.origin)});el.addEventListener('keydown',function(event){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();el.blur()}})}
  function wireAll(selector,key,field){document.querySelectorAll(selector).forEach(function(el){wireText(el,key,field)})}
  function wireCards(selector,type){document.querySelectorAll(selector).forEach(function(card,index){var key=type+':'+index;wireText(card.querySelector('.service-name,.concept-name,.pricing-tier,.pricing-name,.portfolio-title'),key,'title');wireText(card.querySelector('.service-cat,.concept-cat,.service-subtitle'),key,'subtitle');wireText(card.querySelector('.pricing-price,.pricing-amount,.bento-price'),key,'price');wireText(card.querySelector('.pricing-body p,.pricing-desc,.service-desc,.portfolio-desc,.masonry-hover span'),key,'description')})}
  function imageButton(key){var button=document.createElement('button');button.type='button';button.className='tlora-image-button';button.textContent='Thêm / thay ảnh';button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();window.parent.postMessage({type:'tlora-builder-image',key:key},window.location.origin)});return button}
  function wireImage(el,key){if(!el)return;var wrap=el;if(el.tagName==='IMG'&&el.parentElement)wrap=el.parentElement;wrap.classList.add('tlora-image-wrap');wrap.dataset.tloraEditable=key;if(!wrap.querySelector(':scope > .tlora-image-button'))wrap.appendChild(imageButton(key));wrap.addEventListener('click',function(event){event.stopPropagation();select(wrap,key)})}
  function wireImages(selector,key){document.querySelectorAll(selector).forEach(function(el){wireImage(el,key)})}
  function wireCardImages(selector,type){document.querySelectorAll(selector).forEach(function(card,index){var key=type+':'+index;wireImage(card.querySelector('img,.service-card-bg,.gallery-image,.portfolio-image'),key)})}
  mark('.logo,.footer-logo','brand');
  mark('.hero,#hero','hero');
  mark('.about','about');
  mark('.service-card,.concept-card','services');
  mark('.pricing-card','pricing');
  mark('.gallery-item,.masonry-item,.portfolio-item','gallery');
  mark('footer,.cta-banner,#cta-final','contact');
  wireAll('.hero-title,.hero-h1','hero:0','title');
  wireAll('.hero-desc,.hero-sub,.hero-subtitle','hero:0','description');
  wireAll('.btn-primary,.nav-cta,.mobile-menu-cta','hero:0','cta');
  wireAll('.about .section-title,.about-title','about:0','title');
  wireAll('.about .section-body,.about-text,.about-desc,.about-quote','about:0','description');
  wireCards('.service-card,.concept-card','services');
  wireCards('.pricing-card','pricing');
  wireCards('.gallery-item,.masonry-item,.portfolio-item','gallery');
  wireImages('.logo,.footer-logo','brand:0');
  wireImages('.hero-bg-image,.hero-bg img,.hero,#hero','hero:0');
  wireImages('.about-image img,.about-image,.about-image-frame','about:0');
  wireCardImages('.service-card,.concept-card','services');
  wireCardImages('.pricing-card','pricing');
  wireCardImages('.gallery-item,.masonry-item,.portfolio-item','gallery');
  window.parent.postMessage({type:'tlora-builder-ready'},window.location.origin);
});
window.addEventListener('message',function(event){
  if(event.origin!==window.location.origin||!event.data)return;
  if(event.data.type==='tlora-builder-preview'){
    if(event.data.studio&&window.__applyTloraBranding)window.__applyTloraBranding(event.data.studio);
    if(event.data.content&&window.__applyTloraContent)window.__applyTloraContent(event.data.content);
    if(event.data.selected){document.querySelectorAll('.tlora-selected').forEach(function(x){x.classList.remove('tlora-selected')});var el=document.querySelector('[data-tlora-editable="'+event.data.selected+'"]');if(el)el.classList.add('tlora-selected')}
  }
});
</script>`;
}

function headCode(settings: Record<string, unknown>) {
  const keywords = String(settings.seo_keywords || "");
  const canonical = String(settings.canonical_url || "");
  const tracking = [
    settings.google_analytics_id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(String(settings.google_analytics_id))}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${String(settings.google_analytics_id).replace(/'/g, "\\'")}');</script>` : "",
    settings.facebook_pixel_id ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${String(settings.facebook_pixel_id).replace(/'/g, "\\'")}');fbq('track','PageView');</script>` : "",
  ].join("");
  return `<meta name="keywords" content="${escapeHtml(keywords)}">${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ""}${tracking}${String(settings.custom_head_code || "")}`;
}

export async function themeResponse(studioSlug: string, page = "home", builder = false) {
  const admin = createAdminClient();
  const { data: studio } = await admin.from("studios").select("display_name,status,settings").eq("slug", studioSlug).eq("status", "active").maybeSingle();
  if (!studio) return new NextResponse("Not found", { status: 404 });

  const settings = studio.settings || {};
  const theme = settings.theme === "wedding" ? "wedding" : "concept";
  const [folder, file] = themeFiles[theme];
  const source = await readFile(path.join(process.cwd(), "src", "studio-themes", folder, file), "utf8");
  const branding = safeJson({
    name: studio.display_name,
    phone: fixMojibake(String(settings.phone || "")),
    email: settings.email || "",
    address: fixMojibake(String(settings.address || "")),
    facebook: settings.facebook_url || "",
    zalo: settings.zalo_phone || "",
    logo: settings.logo_url || "",
    primary: settings.primary_color || "",
    accent: settings.accent_color || "",
  });
  const bodyCode = String(settings.custom_body_code || "");
  const body = settings.defer_non_critical ? `<script>window.addEventListener('load',function(){${bodyCode}})</script>` : bodyCode;
  const injectedHead = [
    `<link rel="icon" href="/studio-site/${studioSlug}/favicon">`,
    headCode(settings),
    themeOverrideStyle(settings),
    studioBridge(branding, safeJson(page)),
    contentBridge(safeJson(fixMojibakeDeep(settings.site_content || {}))),
    builderBridge(builder),
  ].join("");
  const html = source.replace("</head>", `${injectedHead}</head>`).replace("</body>", `${body}</body>`);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  return themeResponse(studioSlug, "home", new URL(request.url).searchParams.get("builder") === "1");
}
