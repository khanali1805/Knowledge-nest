import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeRateLimit,
  getRateLimitHeaders,
  getRequestClientAddress,
} from "@/lib/rate-limit";
const ADMIN_SESSION_COOKIE = "knowledge_nest_admin_session";
const ADMIN_LOGIN_PATH = "/admin/login";
const REQUEST_PATHNAME_HEADER = "x-knowledge-nest-request-pathname";
const ADMIN_SESSION_ISSUER = "knowledge-nest";
const ADMIN_SESSION_AUDIENCE = "knowledge-nest-admin";
const ADMIN_MUTATION_RATE_LIMIT = 120;
const ADMIN_MUTATION_RATE_WINDOW_MS = 60 * 1000;
const MAX_ADMIN_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_ADMIN_MEDIA_REQUEST_BYTES = 12 * 1024 * 1024;
const PUBLIC_ADMIN_API_PATHS = new Set([
  "/api/admin/auth/login",
  "/api/admin/auth/logout",
  "/api/admin/auth/session",
]);
const PUBLIC_RATE_LIMITS = new Map<
  string,
  {
    limit: number;
    windowMilliseconds: number;
  }
>([
  [
    "/api/search",
    {
      limit: 60,
      windowMilliseconds: 60 * 1000,
    },
  ],
  [
    "/api/categories",
    {
      limit: 120,
      windowMilliseconds: 60 * 1000,
    },
  ],
  [
    "/api/blogging/overview",
    {
      limit: 60,
      windowMilliseconds: 60 * 1000,
    },
  ],
  [
    "/api/og",
    {
      limit: 30,
      windowMilliseconds: 60 * 1000,
    },
  ],
]);
function getSessionSecret(): Uint8Array | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }
  return new TextEncoder().encode(secret);
}
async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = getSessionSecret();
  if (!token || !secret) {
    return false;
  }
  try {
    const verification = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: ADMIN_SESSION_ISSUER,
      audience: ADMIN_SESSION_AUDIENCE,
      subject: "knowledge-nest-admin",
    });
    const username = verification.payload.username;
    const configuredUsername = process.env.ADMIN_USERNAME;
    return (
      typeof username === "string" &&
      username.length > 0 &&
      typeof configuredUsername === "string" &&
      configuredUsername.length > 0 &&
      username === configuredUsername
    );
  } catch {
    return false;
  }
}
function createForwardResponse(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
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
  return response;
}
function clearInvalidSession(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
    priority: "high",
  });
  return response;
}
function createLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  const currentPath = request.nextUrl.pathname + request.nextUrl.search;
  if (currentPath.startsWith("/admin") && currentPath !== ADMIN_LOGIN_PATH) {
    loginUrl.searchParams.set("next", currentPath);
  }
  return applySecurityHeaders(clearInvalidSession(NextResponse.redirect(loginUrl)));
}
function createUnauthorizedApiResponse(): NextResponse {
  return applySecurityHeaders(
    clearInvalidSession(
      NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Admin authentication required.",
        },
        {
          status: 401,
        },
      ),
    ),
  );
}
function normalizeHostname(hostname: string): string {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") {
    return "loopback";
  }
  return normalized;
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
  return (
    normalizePort(requestProtocol, requestOrigin.port) ===
    normalizePort(suppliedProtocol, suppliedOrigin.port)
  );
}
function getForwardedOrigin(request: NextRequest): URL | null {
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
  const requestProtocol = request.nextUrl.protocol.replace(":", "");
  const protocol = forwardedProtocol || requestProtocol || "http";
  try {
    return new URL(`${protocol}://${host}`);
  } catch {
    return null;
  }
}
function isSameOriginMutation(request: NextRequest): boolean {
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
  const candidateOrigins: URL[] = [new URL(request.url)];
  const forwardedOrigin = getForwardedOrigin(request);
  if (forwardedOrigin) {
    candidateOrigins.push(forwardedOrigin);
  }
  return candidateOrigins.some((candidate) => originsMatch(candidate, suppliedOrigin));
}
function isMutationMethod(method: string): boolean {
  return (
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE"
  );
}
function getRequestContentLength(request: NextRequest): number | null {
  const raw = request.headers.get("content-length");
  if (!raw) {
    return null;
  }
  if (!/^\d+$/.test(raw.trim())) {
    return Number.POSITIVE_INFINITY;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 0) {
    return Number.POSITIVE_INFINITY;
  }
  return value;
}
function getAdminBodyLimit(pathname: string): number {
  if (pathname === "/api/admin/media" || pathname === "/api/admin/media/upload") {
    return MAX_ADMIN_MEDIA_REQUEST_BYTES;
  }
  return MAX_ADMIN_REQUEST_BYTES;
}
function createAdminRateLimitResponse(
  retryHeaders: Record<string, string>,
): NextResponse {
  return applySecurityHeaders(
    NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: retryHeaders,
      },
    ),
  );
}
function createAdminRejectedResponse(status: number, message: string): NextResponse {
  return applySecurityHeaders(
    NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status,
      },
    ),
  );
}
function handlePublicRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const policy = PUBLIC_RATE_LIMITS.get(pathname);
  if (!policy) {
    return null;
  }
  const clientAddress = getRequestClientAddress(request);
  const rateLimit = consumeRateLimit({
    key: `public:${pathname}:${clientAddress}`,
    limit: policy.limit,
    windowMilliseconds: policy.windowMilliseconds,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(rateLimit),
          "Cache-Control": "no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  if (pathname === "/api/search") {
    const query = request.nextUrl.searchParams.get("q");
    if (query && query.length > 200) {
      return NextResponse.json([], {
        status: 400,
        headers: {
          ...getRateLimitHeaders(rateLimit),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }
  }
  if (pathname === "/api/og") {
    const title = request.nextUrl.searchParams.get("title");
    if (title && title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request.",
        },
        {
          status: 400,
          headers: {
            ...getRateLimitHeaders(rateLimit),
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }
  }
  const response = createForwardResponse(request);
  for (const [headerName, headerValue] of Object.entries(
    getRateLimitHeaders(rateLimit),
  )) {
    response.headers.set(headerName, headerValue);
  }
  return response;
}
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const publicResponse = handlePublicRateLimit(request);
  if (publicResponse) {
    return publicResponse;
  }
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  if (!isAdminPage && !isAdminApi) {
    return createForwardResponse(request);
  }
  const mutation = isAdminApi && isMutationMethod(request.method);
  if (mutation) {
    if (!isSameOriginMutation(request)) {
      return createAdminRejectedResponse(403, "Cross-origin admin request rejected.");
    }
    const contentLength = getRequestContentLength(request);
    if (contentLength !== null && contentLength > getAdminBodyLimit(pathname)) {
      return createAdminRejectedResponse(413, "Admin request payload is too large.");
    }
    const clientAddress = getRequestClientAddress(request);
    const mutationRateLimit = consumeRateLimit({
      key: `admin-mutation:${pathname}:${clientAddress}`,
      limit: ADMIN_MUTATION_RATE_LIMIT,
      windowMilliseconds: ADMIN_MUTATION_RATE_WINDOW_MS,
    });
    if (!mutationRateLimit.allowed) {
      return createAdminRateLimitResponse(getRateLimitHeaders(mutationRateLimit));
    }
  }
  const authenticated = await hasValidAdminSession(request);
  if (pathname === ADMIN_LOGIN_PATH) {
    if (authenticated) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    }
    return applySecurityHeaders(createForwardResponse(request));
  }
  if (isAdminApi && PUBLIC_ADMIN_API_PATHS.has(pathname)) {
    return applySecurityHeaders(createForwardResponse(request));
  }
  if (!authenticated) {
    if (isAdminApi) {
      return createUnauthorizedApiResponse();
    }
    return createLoginRedirect(request);
  }
  return applySecurityHeaders(createForwardResponse(request));
}
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/search",
    "/api/categories",
    "/api/blogging/overview",
    "/api/og",
  ],
};
