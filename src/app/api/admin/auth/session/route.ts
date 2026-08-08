import { getAdminSession } from "@/lib/admin-auth";
import { createAdminJsonResponse } from "@/lib/admin-security";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return createAdminJsonResponse(
      {
        authenticated: false,
      },
      401,
    );
  }
  return createAdminJsonResponse({
    authenticated: true,
    username: session.username,
  });
}
