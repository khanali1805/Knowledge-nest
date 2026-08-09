type RequestError = Error & {
  digest?: string;
};

type RequestDetails = {
  path: string;
  method: string;
  headers: Record<string, string | string[]>;
};

type RequestContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
  renderSource?: string;
  revalidateReason?: string;
  renderType?: string;
};

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { registerPerformanceMonitoring } =
    await import("./lib/application-performance-monitoring");

  registerPerformanceMonitoring();
}

export async function onRequestError(
  error: RequestError,
  request: RequestDetails,
  context: RequestContext,
): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "knowledge-nest",
        event: "next.request.error",
        runtime: process.env.NEXT_RUNTIME ?? "edge",
        errorName: error.name,
        errorMessage: error.message,
        digest: error.digest ?? null,
        path: request.path,
        method: request.method,
        routePath: context.routePath,
        routeType: context.routeType,
      }),
    );

    return;
  }

  const { logPerformanceEvent } =
    await import("./lib/application-performance-monitoring");

  logPerformanceEvent("error", "next.request.error", {
    errorName: error.name,
    errorMessage: error.message,
    digest: error.digest ?? null,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource ?? null,
    revalidateReason: context.revalidateReason ?? null,
    renderType: context.renderType ?? null,
  });
}
