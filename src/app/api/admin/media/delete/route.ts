import { NextResponse } from "next/server";
import { deleteMediaFile } from "@/lib/media-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type DeleteMediaRequest = {
  id?: unknown;
  fileName?: unknown;
};
export async function DELETE(request: Request) {
  try {
    let requestBody: DeleteMediaRequest;
    try {
      requestBody = (await request.json()) as DeleteMediaRequest;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The media request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const identifier =
      typeof requestBody.id === "string" && requestBody.id.trim()
        ? requestBody.id.trim()
        : typeof requestBody.fileName === "string" && requestBody.fileName.trim()
          ? requestBody.fileName.trim()
          : "";
    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid media identifier is required.",
        },
        {
          status: 400,
        },
      );
    }
    const result = await deleteMediaFile(identifier);
    return NextResponse.json({
      success: true,
      deleted: true,
      id: result.id,
      fileRemoved: result.fileRemoved,
      message: result.fileRemoved
        ? "Media file deleted successfully."
        : "Media record deleted successfully. Physical file cleanup will not block the media library.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        deleted: false,
        message:
          error instanceof Error ? error.message : "Unable to delete the media file.",
      },
      {
        status: 400,
      },
    );
  }
}
