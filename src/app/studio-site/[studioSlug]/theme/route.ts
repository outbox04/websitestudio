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

export async function GET(_: Request, { params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
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
    logo: studio.settings?.logo_url || "",
    primary: studio.settings?.primary_color || "",
    accent: studio.settings?.accent_color || "",
  });

  const bridge = `<style id="tlora-theme-overrides">:root{--tlora-primary:var(--gold);}${studio.settings?.primary_color ? `body{--bg:${studio.settings.primary_color};}` : ""}${studio.settings?.accent_color ? `:root{--gold:${studio.settings.accent_color};}` : ""}.logo img,.footer-logo img{display:block;max-height:46px;max-width:190px;width:auto;object-fit:contain}.footer-logo img{max-height:36px}</style><script>window.__TLORA_STUDIO__=${branding};document.addEventListener('DOMContentLoaded',function(){var s=window.__TLORA_STUDIO__;document.title=s.name;function putLogo(el){var image=document.createElement('img');image.src=s.logo;image.alt=s.name;el.replaceChildren(image)}var logo=document.querySelector('.logo');if(s.logo&&logo){putLogo(logo);logo.setAttribute('aria-label',s.name)}else{document.querySelectorAll('.logo-title,.logo-sub,.logo').forEach(function(el){if(el.classList.contains('logo')&&el.querySelector('.logo-mark')){el.lastChild.textContent=' '+s.name}else if(el.classList.contains('logo-title')){el.textContent=s.name}else if(el.classList.contains('logo-sub')){el.textContent='Studio'}})}document.querySelectorAll('.footer-logo').forEach(function(el){if(s.logo){putLogo(el)}else{el.textContent=s.name}});document.querySelectorAll('a[href="#"],.btn-booking').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();document.querySelector('#footer')?.scrollIntoView({behavior:'smooth'})})});});</script>`;
  const html = source.replace("</head>", `${bridge}</head>`);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN" } });
}
