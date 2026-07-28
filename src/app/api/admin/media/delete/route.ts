import { NextResponse } from "next/server";
import { deleteMediaFile } from "@/lib/media-storage";
export const runtime = "nodejs";
type DeleteMediaRequest = {
  fileName?: unknown;
};
export async function DELETE(request: Request) {
  try {
    const requestBody = (await request.json()) as DeleteMediaRequest;
    if (typeof requestBody.fileName !== "string" || !requestBody.fileName.trim()) {
      return NextResponse.json(
        {
          message: "A valid media file name is required.",
        },
        {
          status: 400,
        },
      );
    }
    await deleteMediaFile(requestBody.fileName.trim());
    return NextResponse.json({
      message: "Media file deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to delete the media file.",
      },
      {
        status: 400,
      },
    );
  }
}
