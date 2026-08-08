import { type NextRequest, NextResponse } from "next/server";
import {
  ARTICLE_IMAGE_HEIGHT,
  ARTICLE_IMAGE_WIDTH,
  listMediaFiles,
  saveMediaFile,
} from "@/lib/media-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? "";
    const files = await listMediaFiles();
    const filteredFiles = query
      ? files.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.originalName.toLowerCase().includes(query),
        )
      : files;
    return NextResponse.json({
      success: true,
      files: filteredFiles,
      media: filteredFiles,
      count: filteredFiles.length,
      imagePolicy: {
        width: ARTICLE_IMAGE_WIDTH,
        height: ARTICLE_IMAGE_HEIGHT,
        aspectRatio: "16:9",
        format: "webp",
        behavior: "automatic-cover-crop-resize",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        files: [],
        media: [],
        count: 0,
        message: error instanceof Error ? error.message : "Unable to load media.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Select an image to upload.",
        },
        {
          status: 400,
        },
      );
    }
    const savedFile = await saveMediaFile(file);
    return NextResponse.json(
      {
        success: true,
        file: savedFile,
        media: savedFile,
        imagePolicy: {
          width: ARTICLE_IMAGE_WIDTH,
          height: ARTICLE_IMAGE_HEIGHT,
          aspectRatio: "16:9",
          format: "webp",
        },
        message: `Image uploaded and automatically normalized to ${ARTICLE_IMAGE_WIDTH}x${ARTICLE_IMAGE_HEIGHT}.`,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to upload image.",
      },
      {
        status: 400,
      },
    );
  }
}
