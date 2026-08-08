import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
export const ADMIN_SESSION_COOKIE = "knowledge_nest_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
type AdminSessionPayload = {
  username: string;
};
function getSessionSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short.");
  }
  return new TextEncoder().encode(secret);
}
export async function createAdminSession(username: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await new SignJWT({
    username,
  } satisfies AdminSessionPayload)
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject("knowledge-nest-admin")
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSessionSecret());
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}
export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
    priority: "high",
  });
}
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  try {
    const verification = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      subject: "knowledge-nest-admin",
    });
    const username = verification.payload.username;
    if (typeof username !== "string" || !username) {
      return null;
    }
    return {
      username,
    };
  } catch {
    return null;
  }
}
