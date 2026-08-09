export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAXIMUM_ORIGINAL_IMAGE_SIZE = 10 * 1024 * 1024;
const MAXIMUM_PREPARED_IMAGE_SIZE = 3.5 * 1024 * 1024;
const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 900;

function createOutputFileName(originalName: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, "").trim() || "image";
  return `${baseName}.webp`;
}

async function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Unable to prepare the selected image."));
      },
      "image/webp",
      quality,
    );
  });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (
    !ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])
  ) {
    throw new Error("Only JPG, PNG and WebP images are supported.");
  }

  if (file.size <= 0) {
    throw new Error("The selected image is empty.");
  }

  if (file.size > MAXIMUM_ORIGINAL_IMAGE_SIZE) {
    throw new Error("The selected image exceeds the 10 MB selection limit.");
  }

  const bitmap = await createImageBitmap(file);

  try {
    if (!bitmap.width || !bitmap.height) {
      throw new Error("Image dimensions could not be detected.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const context = canvas.getContext("2d", {
      alpha: false,
    });

    if (!context) {
      throw new Error("Browser image processing is unavailable.");
    }

    const sourceRatio = bitmap.width / bitmap.height;
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = bitmap.width;
    let sourceHeight = bitmap.height;

    if (sourceRatio > targetRatio) {
      sourceWidth = Math.round(bitmap.height * targetRatio);
      sourceX = Math.round((bitmap.width - sourceWidth) / 2);
    } else if (sourceRatio < targetRatio) {
      sourceHeight = Math.round(bitmap.width / targetRatio);
      sourceY = Math.round((bitmap.height - sourceHeight) / 2);
    }

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    );

    let preparedBlob: Blob | null = null;

    for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
      const candidate = await canvasToWebp(canvas, quality);
      preparedBlob = candidate;
      if (candidate.size <= MAXIMUM_PREPARED_IMAGE_SIZE) {
        break;
      }
    }

    if (!preparedBlob || preparedBlob.size > MAXIMUM_PREPARED_IMAGE_SIZE) {
      throw new Error("The image could not be reduced to a safe upload size.");
    }

    return new File([preparedBlob], createOutputFileName(file.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    if (response.status === 413) {
      throw new Error("The image upload payload was rejected as too large.");
    }

    throw new Error(
      `Media API returned HTTP ${response.status} instead of JSON. Please retry after the current deployment finishes.`,
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error("Media API returned an invalid JSON response.");
  }
}
