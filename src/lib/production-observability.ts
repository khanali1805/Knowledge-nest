import "server-only";
import { randomUUID } from "node:crypto";
export type ProductionLogLevel = "info" | "warn" | "error";
type ProductionEventInput = {
  level: ProductionLogLevel;
  event: string;
  route: string;
  requestId?: string | null;
  durationMilliseconds?: number;
  status?: number;
  error?: unknown;
  details?: Record<string, string | number | boolean | null>;
};
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
export function getRequestId(request: Request): string {
  const incomingRequestId = request.headers.get("x-request-id")?.trim();
  if (incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)) {
    return incomingRequestId;
  }
  return randomUUID();
}
export function getRequestHeaders(requestId: string): Record<string, string> {
  return {
    "Cache-Control": "no-store, max-age=0",
    "X-Request-Id": requestId,
  };
}
export function getTemporaryFailureHeaders(requestId: string): Record<string, string> {
  return {
    ...getRequestHeaders(requestId),
    "Retry-After": "5",
  };
}
function getErrorType(error: unknown): string | null {
  if (error instanceof Error) {
    return error.name?.trim() || "Error";
  }
  if (error === null || typeof error === "undefined") {
    return null;
  }
  return "UnknownError";
}
export function logProductionEvent(input: ProductionEventInput): void {
  const payload = {
    timestamp: new Date().toISOString(),
    service: "knowledge-nest",
    environment: process.env.NODE_ENV ?? "unknown",
    deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
    level: input.level,
    event: input.event,
    route: input.route,
    requestId: input.requestId ?? null,
    status: input.status ?? null,
    durationMilliseconds: input.durationMilliseconds ?? null,
    errorType: getErrorType(input.error),
    details: input.details ?? null,
  };
  const serialized = JSON.stringify(payload);
  if (input.level === "error") {
    console.error(serialized);
    return;
  }
  if (input.level === "warn") {
    console.warn(serialized);
    return;
  }
  console.info(serialized);
}
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMilliseconds: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        const timeoutError = new Error("Operation timeout.");
        timeoutError.name = "TimeoutError";
        reject(timeoutError);
      }, timeoutMilliseconds);
    });
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
