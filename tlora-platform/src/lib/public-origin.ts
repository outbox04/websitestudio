type HeaderReader = Pick<Headers, "get">;

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function protocolForHost(host: string, forwardedProto: string | null) {
  if (forwardedProto) {
    return forwardedProto;
  }

  return host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
}

export function publicOriginFromHeaders(headers: HeaderReader) {
  const forwardedHost = firstHeaderValue(headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(headers.get("x-forwarded-proto"));
  const host = forwardedHost || headers.get("host");

  if (host) {
    return `${protocolForHost(host, forwardedProto)}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
}

export function customerUrlFromOrigin(origin: string, slug: string) {
  return origin ? `${origin.replace(/\/$/, "")}/${slug}` : `/${slug}`;
}

export function customerDoneUrlFromOrigin(origin: string, slug: string) {
  return `${customerUrlFromOrigin(origin, slug)}/done`;
}

export function getGalleryUrls(customerSlug: string, studioSlug: string | null, requestOrigin?: string) {
  const rootDomain = process.env.ROOT_DOMAIN || "tlgroup.site";
  let origin = "";

  if (studioSlug) {
    origin = `https://${studioSlug}.${rootDomain}`;
  } else if (requestOrigin && !requestOrigin.includes(rootDomain)) {
    // For localhost or IP addresses, preserve the requested dev server host
    origin = requestOrigin;
  } else {
    origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${rootDomain}`;
  }

  const customerUrl = `${origin.replace(/\/$/, "")}/${customerSlug}`;
  return {
    customerUrl,
    customerDoneUrl: `${customerUrl}/done`
  };
}
