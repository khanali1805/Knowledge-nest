import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Media identifier is required.",
      },
      {
        status: 400,
      },
    );
  }

  const [record] = await db
    .select({
      fileData: media.fileData,
      mimeType: media.mimeType,
      fileName: media.fileName,
    })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);

  if (!record?.fileData) {
    return NextResponse.json(
      {
        success: false,
        message: "Media file was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const bytes = new Uint8Array(record.fileData);

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": record.mimeType || "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename="${encodeURIComponent(record.fileName)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
