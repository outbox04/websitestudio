import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase() || "";
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  const isStudioSubdomain = hostname.endsWith(`.${rootDomain}`) && !hostname.startsWith(`www.${rootDomain}`);

  if (isStudioSubdomain && request.nextUrl.pathname === "/") {
    const studioSlug = hostname.slice(0, -(rootDomain.length + 1));
    if (studioSlug && !studioSlug.includes(".")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${studioSlug}`;
      return NextResponse.rewrite(url);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
