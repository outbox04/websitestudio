import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostname = (forwardedHost || request.headers.get("host") || "").split(":")[0].toLowerCase();
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  const isStudioSubdomain = hostname.endsWith(`.${rootDomain}`) && !hostname.startsWith(`www.${rootDomain}`);

  const isStudioRoute = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/theme" || request.nextUrl.pathname === "/quan-tri" || request.nextUrl.pathname === "/tin-tuc" || request.nextUrl.pathname.startsWith("/tin-tuc/");
  if (isStudioSubdomain && isStudioRoute) {
    const studioSlug = hostname.slice(0, -(rootDomain.length + 1));
    if (studioSlug && !studioSlug.includes(".")) {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.pathname === "/quan-tri" ? `/studio-site/${studioSlug}/quan-tri` : request.nextUrl.pathname === "/" ? `/studio-site/${studioSlug}` : `/studio-site/${studioSlug}${request.nextUrl.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
