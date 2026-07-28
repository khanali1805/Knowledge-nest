import { NextResponse } from "next/server";
import { listMediaFiles } from "@/lib/media-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const files = await listMediaFiles();
    return NextResponse.json({
      files,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to load media files.",
      },
      {
        status: 500,
      },
    );
  }
}
