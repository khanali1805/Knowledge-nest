export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAXIMUM_ORIGINAL_IMAGE_SIZE = 10 * 1024 * 1024;
const MAXIMUM_PREPARED_IMAGE_SIZE = 2.75 * 1024 * 1024;
const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 900;
function createOutputFileName(originalName: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, "").trim() || "image";
  return `${baseName}.webp`;
}
function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be decoded."));
    };
    image.src = objectUrl;
  });
}
async function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Browser image conversion failed."));
          return;
        }
        resolve(blob);
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
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("The selected image is empty.");
  }
  if (file.size > MAXIMUM_ORIGINAL_IMAGE_SIZE) {
    throw new Error("The selected image exceeds the 10 MB selection limit.");
  }
  const image = await createImageElement(file);
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
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
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (sourceRatio > targetRatio) {
    sourceWidth = Math.round(image.naturalHeight * targetRatio);
    sourceX = Math.round((image.naturalWidth - sourceWidth) / 2);
  } else if (sourceRatio < targetRatio) {
    sourceHeight = Math.round(image.naturalWidth / targetRatio);
    sourceY = Math.round((image.naturalHeight - sourceHeight) / 2);
  }
  context.drawImage(
    image,
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
  for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54, 0.46]) {
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
}
export async function readJsonResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    if (response.status === 413) {
      throw new Error(
        "The image upload request was rejected because the payload was too large.",
      );
    }
    if (response.status === 401) {
      throw new Error("Your admin session has expired. Sign in again and retry.");
    }
    if (response.status === 403) {
      throw new Error("The current admin session is not allowed to upload media.");
    }
    if (response.status >= 500) {
      throw new Error(`Media server failed with HTTP ${response.status}.`);
    }
    throw new Error(
      `Media API returned HTTP ${response.status} with an unexpected response type.`,
    );
  }
  if (!responseText.trim()) {
    throw new Error(`Media API returned an empty HTTP ${response.status} response.`);
  }
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`Media API returned invalid JSON with HTTP ${response.status}.`);
  }
}
