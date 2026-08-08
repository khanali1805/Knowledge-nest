import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type HealthStatus = "ok" | "degraded";
type DatabaseHealthStatus = "ok" | "failed" | "not-configured";
const DATABASE_HEALTH_TIMEOUT_MS = 5_000;
type DatabaseHealthCheck = {
  status: DatabaseHealthStatus;
  configured: boolean;
  connected: boolean;
  responseTimeMilliseconds: number;
};
async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMilliseconds: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Health check timeout."));
    }, timeoutMilliseconds);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
async function checkDatabase(): Promise<DatabaseHealthCheck> {
  const startedAt = Date.now();
  const configured = Boolean(process.env.DATABASE_URL?.trim());
  if (!configured) {
    return {
      status: "not-configured",
      configured: false,
      connected: false,
      responseTimeMilliseconds: Date.now() - startedAt,
    };
  }
  try {
    await withTimeout(db.execute(sql`select 1`), DATABASE_HEALTH_TIMEOUT_MS);
    return {
      status: "ok",
      configured: true,
      connected: true,
      responseTimeMilliseconds: Date.now() - startedAt,
    };
  } catch {
    return {
      status: "failed",
      configured: true,
      connected: false,
      responseTimeMilliseconds: Date.now() - startedAt,
    };
  }
}
export async function GET() {
  const startedAt = Date.now();
  const database = await checkDatabase();
  const status: HealthStatus = database.status === "ok" ? "ok" : "degraded";
  const deploymentCommit = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null;
  return NextResponse.json(
    {
      status,
      application: "Knowledge Nest",
      environment: process.env.NODE_ENV ?? "unknown",
      databaseConfigured: database.configured,
      databaseConnected: database.connected,
      checks: {
        database,
      },
      uptimeSeconds: Math.floor(process.uptime()),
      deploymentCommit: deploymentCommit ? deploymentCommit.slice(0, 12) : null,
      responseTimeMilliseconds: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Knowledge-Nest-Health": status,
      },
    },
  );
}
