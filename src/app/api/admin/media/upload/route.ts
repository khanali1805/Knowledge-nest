import { NextResponse } from "next/server";
import { saveMediaFile } from "@/lib/media-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          message: "A valid image file is required.",
        },
        {
          status: 400,
        },
      );
    }
    const file = await saveMediaFile(uploadedFile);
    return NextResponse.json(
      {
        file,
        message: "Image uploaded successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to upload the image.",
      },
      {
        status: 400,
      },
    );
  }
}
