import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminSession } from "@/lib/admin-auth";
import { createAdminJsonResponse, isSameOriginRequest } from "@/lib/admin-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Invalid login request.",
      },
      403,
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
      );
    }
    const usernameMatches = secureTextEqual(parsedBody.data.username, configuredUsername);
    const passwordMatches = await bcrypt.compare(
      parsedBody.data.password,
      configuredPasswordHash,
    );
    if (!usernameMatches || !passwordMatches) {
      return createAdminJsonResponse(
        {
          success: false,
          message: "Incorrect username or password.",
        },
        401,
      );
    }
    await createAdminSession(configuredUsername);
    return createAdminJsonResponse({
      success: true,
    });
  } catch {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Unable to complete login.",
      },
      500,
    );
  }
}
