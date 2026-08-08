import { deleteAdminSession } from "@/lib/admin-auth";
import { createAdminJsonResponse, isSameOriginRequest } from "@/lib/admin-security";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Invalid logout request.",
      },
      403,
    );
  }
  await deleteAdminSession();
  return createAdminJsonResponse({
    success: true,
  });
}
