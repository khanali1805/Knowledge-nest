import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    status: "ok",
    application: "Knowledge Nest",
    databaseConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    timestamp: new Date().toISOString(),
  });
}
