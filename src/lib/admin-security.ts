import "server-only";
import { NextResponse } from "next/server";
const PRIVATE_CACHE_CONTROL = "no-store, no-cache, must-revalidate, proxy-revalidate";
function normalizeHostname(hostname: string): string {
  const normalizedHostname = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "::1"
  ) {
    return "loopback";
  }
  return normalizedHostname;
}
function normalizePort(protocol: string, port: string): string {
  if (port) {
    return port;
  }
  if (protocol === "https:") {
    return "443";
  }
  return "80";
}
function originsMatch(requestOrigin: URL, suppliedOrigin: URL): boolean {
  const requestProtocol = requestOrigin.protocol.toLowerCase();
  const suppliedProtocol = suppliedOrigin.protocol.toLowerCase();
  if (requestProtocol !== suppliedProtocol) {
    return false;
  }
  const requestHostname = normalizeHostname(requestOrigin.hostname);
  const suppliedHostname = normalizeHostname(suppliedOrigin.hostname);
  if (requestHostname !== suppliedHostname) {
    return false;
  }
  const requestPort = normalizePort(requestProtocol, requestOrigin.port);
  const suppliedPort = normalizePort(suppliedProtocol, suppliedOrigin.port);
  return requestPort === suppliedPort;
}
function getForwardedRequestOrigin(request: Request): URL | null {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  if (!host) {
    return null;
  }
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const requestProtocol = new URL(request.url).protocol.replace(":", "");
  const protocol = forwardedProtocol || requestProtocol || "http";
  try {
    return new URL(`${protocol}://${host}`);
  } catch {
    return null;
  }
}
export function applyAdminSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  return response;
}
export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") {
    return false;
  }
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return (
      !fetchSite ||
      fetchSite === "same-origin" ||
      fetchSite === "same-site" ||
      fetchSite === "none"
    );
  }
  if (originHeader.trim().toLowerCase() === "null") {
    return false;
  }
  let suppliedOrigin: URL;
  try {
    suppliedOrigin = new URL(originHeader);
  } catch {
    return false;
  }
  const candidateOrigins: URL[] = [];
  try {
    candidateOrigins.push(new URL(request.url));
  } catch {
    return false;
  }
  const forwardedOrigin = getForwardedRequestOrigin(request);
  if (forwardedOrigin) {
    candidateOrigins.push(forwardedOrigin);
  }
  return candidateOrigins.some((candidateOrigin) =>
    originsMatch(candidateOrigin, suppliedOrigin),
  );
}
export function createAdminJsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return applyAdminSecurityHeaders(
    NextResponse.json(body, {
      status,
      headers,
    }),
  );
}
