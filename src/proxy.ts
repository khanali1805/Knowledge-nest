import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
const ADMIN_SESSION_COOKIE = "knowledge_nest_admin_session";
const ADMIN_LOGIN_PATH = "/admin/login";
const REQUEST_PATHNAME_HEADER = "x-knowledge-nest-request-pathname";
const PUBLIC_ADMIN_API_PATHS = new Set([
  "/api/admin/auth/login",
  "/api/admin/auth/logout",
  "/api/admin/auth/session",
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
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  if (!isAdminPage && !isAdminApi) {
    return createForwardResponse(request);
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
