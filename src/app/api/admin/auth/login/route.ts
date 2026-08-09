import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminSession } from "@/lib/admin-auth";
import { createAdminJsonResponse, isSameOriginRequest } from "@/lib/admin-security";
import {
  consumeRateLimit,
  getRateLimitHeaders,
  getRequestClientAddress,
} from "@/lib/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_LOGIN_BODY_BYTES = 8 * 1024;
const FAILED_LOGIN_DELAY_MS = 800;
const LOGIN_RATE_LIMIT = 8;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(500),
});
function secureTextEqual(suppliedValue: string, expectedValue: string): boolean {
  const suppliedBuffer = Buffer.from(suppliedValue, "utf8");
  const expectedBuffer = Buffer.from(expectedValue, "utf8");
  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
function requestBodyIsTooLarge(request: Request): boolean {
  const rawContentLength = request.headers.get("content-length");
  if (!rawContentLength) {
    return false;
  }
  if (!/^\d+$/.test(rawContentLength.trim())) {
    return true;
  }
  const contentLength = Number.parseInt(rawContentLength, 10);
  return !Number.isFinite(contentLength) || contentLength > MAX_LOGIN_BODY_BYTES;
}
export async function POST(request: Request) {
  const clientAddress = getRequestClientAddress(request);
  const rateLimit = consumeRateLimit({
    key: `admin-login:${clientAddress}`,
    limit: LOGIN_RATE_LIMIT,
    windowMilliseconds: LOGIN_RATE_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Too many login attempts. Please try again later.",
      },
      429,
      getRateLimitHeaders(rateLimit),
    );
  }
  if (!isSameOriginRequest(request)) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Invalid login request.",
      },
      403,
      getRateLimitHeaders(rateLimit),
    );
  }
  if (requestBodyIsTooLarge(request)) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Invalid login request.",
      },
      413,
      getRateLimitHeaders(rateLimit),
    );
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Invalid login request.",
      },
      415,
      getRateLimitHeaders(rateLimit),
    );
  }
  try {
    const body: unknown = await request.json();
    const parsedBody = loginSchema.safeParse(body);
    if (!parsedBody.success) {
      return createAdminJsonResponse(
        {
          success: false,
          message: "Invalid login request.",
        },
        400,
        getRateLimitHeaders(rateLimit),
      );
    }
    const configuredUsername = process.env.ADMIN_USERNAME;
    const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH_B64
      ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8")
      : process.env.ADMIN_PASSWORD_HASH;
    if (!configuredUsername || !configuredPasswordHash) {
      return createAdminJsonResponse(
        {
          success: false,
          message: "Admin authentication is unavailable.",
        },
        500,
        getRateLimitHeaders(rateLimit),
      );
    }
    const usernameMatches = secureTextEqual(parsedBody.data.username, configuredUsername);
    const passwordMatches = await bcrypt.compare(
      parsedBody.data.password,
      configuredPasswordHash,
    );
    if (!usernameMatches || !passwordMatches) {
      await delay(FAILED_LOGIN_DELAY_MS);
      return createAdminJsonResponse(
        {
          success: false,
          message: "Incorrect username or password.",
        },
        401,
        getRateLimitHeaders(rateLimit),
      );
    }
    await createAdminSession(configuredUsername);
    return createAdminJsonResponse(
      {
        success: true,
      },
      200,
      getRateLimitHeaders(rateLimit),
    );
  } catch {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Unable to complete login.",
      },
      500,
      getRateLimitHeaders(rateLimit),
    );
  }
}
