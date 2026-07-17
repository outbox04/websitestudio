import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const adminPrefixes = ["/admin", "/admin-studio", "/api/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isAdmin = adminPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAdminApi = pathname.startsWith("/api/admin");
  const isTloraCms = pathname.startsWith("/admin/tlora")
    || pathname === "/admin-studio"
    || pathname.startsWith("/api/admin/tlora")
    || pathname.startsWith("/api/admin/customer-galleries");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostname = (forwardedHost || request.headers.get("host") || "").split(":")[0].toLowerCase();
  const rootDomain = (process.env.ROOT_DOMAIN || "tlgroup.site").toLowerCase();
  const isStudioSubdomain = hostname.endsWith(`.${rootDomain}`) && !hostname.startsWith(`www.${rootDomain}`);

  if (!isAdmin) {
    return response;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Tenant APIs authorize against studio_members in their route handlers.
  // The platform console remains reserved for TLORA platform administrators.
  if (isAdmin && user && !isTloraCms && !(isAdminApi && isStudioSubdomain)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active,is_platform_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active || !profile.is_platform_admin) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
