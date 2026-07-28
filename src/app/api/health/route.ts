import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type HealthStatus = "ok" | "degraded";
export async function GET() {
  const startedAt = Date.now();
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  let databaseConnected = false;
  let status: HealthStatus = "degraded";
  if (databaseConfigured) {
    try {
      await db.execute(sql`select 1`);
      databaseConnected = true;
      status = "ok";
    } catch {
      databaseConnected = false;
    }
  }
  return NextResponse.json(
    {
      status,
      application: "Knowledge Nest",
      environment: process.env.NODE_ENV,
      databaseConfigured,
      databaseConnected,
      responseTimeMilliseconds: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
