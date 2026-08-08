import { createAdminJsonResponse, isSameOriginRequest } from "@/lib/admin-security";
import {
  activateDesignCode,
  readDesignCodeStore,
  resetDesignCode,
  restoreDesignCodeRevision,
  rollbackDesignCode,
  saveDesignCodeDraft,
} from "@/lib/design-code/store";
import { validateDesignCode } from "@/lib/design-code/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type DesignCodeRequestBody = {
  action?: unknown;
  name?: unknown;
  code?: unknown;
  revisionId?: unknown;
};
async function readRequestBody(request: Request): Promise<DesignCodeRequestBody | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }
    return body as DesignCodeRequestBody;
  } catch {
    return null;
  }
}
function createOperationErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Design Studio operation failed.";
  const normalisedMessage = message.toLowerCase();
  const status =
    normalisedMessage.includes("validation") ||
    normalisedMessage.includes("not allowed") ||
    normalisedMessage.includes("too large") ||
    normalisedMessage.includes("no valid") ||
    normalisedMessage.includes("not found")
      ? 400
      : 500;
  return createAdminJsonResponse(
    {
      success: false,
      message,
    },
    status,
  );
}
export async function GET() {
  try {
    return createAdminJsonResponse({
      success: true,
      store: await readDesignCodeStore(),
    });
  } catch (error) {
    return createOperationErrorResponse(error);
  }
}
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Cross-origin admin request rejected.",
      },
      403,
    );
  }
  const body = await readRequestBody(request);
  if (!body) {
    return createAdminJsonResponse(
      {
        success: false,
        message: "Request body must contain a valid JSON object.",
      },
      400,
    );
  }
  const action = typeof body.action === "string" ? body.action : "";
  const name = typeof body.name === "string" ? body.name : "Knowledge Nest Design";
  const code = typeof body.code === "string" ? body.code : "";
  const revisionId = typeof body.revisionId === "string" ? body.revisionId : "";
  if (action === "validate") {
    const validation = validateDesignCode(code);
    return createAdminJsonResponse(
      {
        success: validation.valid,
        validation,
        message: validation.valid
          ? "Design code is valid."
          : "Design code validation failed.",
      },
      validation.valid ? 200 : 400,
    );
  }
  try {
    if (action === "save") {
      return createAdminJsonResponse({
        success: true,
        store: await saveDesignCodeDraft({
          name,
          code,
        }),
        message: "Design draft saved successfully.",
      });
    }
    if (action === "activate") {
      return createAdminJsonResponse({
        success: true,
        store: await activateDesignCode({
          name,
          code,
        }),
        message: "Design validated and activated successfully.",
      });
    }
    if (action === "rollback") {
      return createAdminJsonResponse({
        success: true,
        store: await rollbackDesignCode(),
        message: "Previous active design restored successfully.",
      });
    }
    if (action === "restore") {
      if (!revisionId) {
        return createAdminJsonResponse(
          {
            success: false,
            message: "A revision ID is required.",
          },
          400,
        );
      }
      return createAdminJsonResponse({
        success: true,
        store: await restoreDesignCodeRevision(revisionId),
        message: "Selected design revision restored successfully.",
      });
    }
    if (action === "reset") {
      return createAdminJsonResponse({
        success: true,
        store: await resetDesignCode(),
        message: "Modern default design restored successfully.",
      });
    }
    return createAdminJsonResponse(
      {
        success: false,
        message: "Unsupported Design Studio action.",
      },
      400,
    );
  } catch (error) {
    return createOperationErrorResponse(error);
  }
}
