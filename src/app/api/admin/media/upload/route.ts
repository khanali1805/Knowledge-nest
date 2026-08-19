import { NextResponse } from "next/server";
import { saveMediaFile } from "@/lib/media-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("The image upload request could not be read.", 400);
  }
  const uploadedFile = formData.get("file");
  if (!(uploadedFile instanceof File)) {
    return jsonError("A valid image file is required.", 400);
  }
  if (uploadedFile.size <= 0) {
    return jsonError("The selected image is empty.", 400);
  }
  if (uploadedFile.size > 3.5 * 1024 * 1024) {
    return jsonError("The prepared image exceeds the 3.5 MB production upload limit.", 413);
  }
  try {
    const file = await saveMediaFile(uploadedFile);
    return NextResponse.json(
      {
        success: true,
        file,
        media: file,
        message: "Image uploaded successfully.",
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload the image.";
    const status = message.toLowerCase().includes("exceed") ? 413 : 500;
    return jsonError(message, status);
  }
}

