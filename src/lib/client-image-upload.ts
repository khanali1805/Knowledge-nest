export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAXIMUM_ORIGINAL_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAXIMUM_PREPARED_IMAGE_SIZE = 3.5 * 1024 * 1024;
export type ImagePresetId =
  "auto" | "landscape" | "portrait" | "square" | "wide" | "classic" | "vertical";
export type ImagePreset = {
  id: ImagePresetId;
  label: string;
  width: number | null;
  height: number | null;
};
export type PreparedImage = {
  file: File;
  width: number;
  height: number;
  preset: ImagePresetId;
};
export const IMAGE_PRESETS: readonly ImagePreset[] = [
  {
    id: "auto",
    label: "Auto / Original orientation",
    width: null,
    height: null,
  },
  {
    id: "landscape",
    label: "Landscape 1600 × 900",
    width: 1600,
    height: 900,
  },
  {
    id: "portrait",
    label: "Portrait 900 × 1600",
    width: 900,
    height: 1600,
  },
  {
    id: "square",
    label: "Square 1200 × 1200",
    width: 1200,
    height: 1200,
  },
  {
    id: "wide",
    label: "Wide 1600 × 1067",
    width: 1600,
    height: 1067,
  },
  {
    id: "classic",
    label: "Classic 1440 × 1080",
    width: 1440,
    height: 1080,
  },
  {
    id: "vertical",
    label: "Vertical 1080 × 1350",
    width: 1080,
    height: 1350,
  },
];
function getPreset(id: ImagePresetId): ImagePreset {
  return IMAGE_PRESETS.find((preset) => preset.id === id) ?? IMAGE_PRESETS[0];
}
function isJsonContentType(contentType: string | null): boolean {
  return Boolean(contentType && contentType.toLowerCase().includes("application/json"));
}
export async function readJsonResponse<T = Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const contentType = response.headers.get("content-type");
  const text = await response.text();
  if (!isJsonContentType(contentType)) {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(
      `Server returned HTTP ${response.status} instead of JSON${
        preview ? `: ${preview}` : "."
      }`,
    );
  }
  if (!text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Server returned invalid JSON with HTTP ${response.status}.`);
  }
}
function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
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
function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Browser image processing failed."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}
function calculateAutoDimensions(
  sourceWidth: number,
  sourceHeight: number,
): {
  width: number;
  height: number;
} {
  const isLandscape = sourceWidth >= sourceHeight;
  const maxWidth = isLandscape ? 1600 : 900;
  const maxHeight = isLandscape ? 900 : 1600;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}
function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
): void {
  const scale = Math.min(
    targetWidth / image.naturalWidth,
    targetHeight / image.naturalHeight,
  );
  const renderWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const renderHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  const x = Math.round((targetWidth - renderWidth) / 2);
  const y = Math.round((targetHeight - renderHeight) / 2);
  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, x, y, renderWidth, renderHeight);
}
export async function prepareImageForUpload(
  inputFile: File,
  presetId: ImagePresetId = "auto",
): Promise<PreparedImage> {
  if (
    !ACCEPTED_IMAGE_TYPES.includes(
      inputFile.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
    )
  ) {
    throw new Error("Only JPG, PNG and WebP images are supported.");
  }
  if (inputFile.size <= 0) {
    throw new Error("The selected image is empty.");
  }
  if (inputFile.size > MAXIMUM_ORIGINAL_IMAGE_SIZE) {
    throw new Error("The original image is larger than the 20 MB limit.");
  }
  const image = await loadBrowserImage(inputFile);
  const preset = getPreset(presetId);
  const dimensions =
    preset.width !== null && preset.height !== null
      ? {
          width: preset.width,
          height: preset.height,
        }
      : calculateAutoDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Browser image processor is unavailable.");
  }
  drawContainedImage(context, image, dimensions.width, dimensions.height);
  let quality = 0.9;
  let blob = await canvasToWebp(canvas, quality);
  while (blob.size > MAXIMUM_PREPARED_IMAGE_SIZE && quality > 0.45) {
    quality = Math.max(0.45, quality - 0.08);
    blob = await canvasToWebp(canvas, quality);
  }
  if (blob.size > MAXIMUM_PREPARED_IMAGE_SIZE) {
    throw new Error("The processed image is still larger than the 3.5 MB upload limit.");
  }
  const cleanBaseName = inputFile.name.replace(/\.[^.]+$/, "").trim() || "image";
  const outputFile = new File([blob], `${cleanBaseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
  return {
    file: outputFile,
    width: dimensions.width,
    height: dimensions.height,
    preset: presetId,
  };
}
