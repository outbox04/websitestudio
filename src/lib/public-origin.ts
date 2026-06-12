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
