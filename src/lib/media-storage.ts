import { randomUUID } from "crypto";
import path from "path";
import { eq, or } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { media } from "@/db/schema";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumFileSize = 4 * 1024 * 1024;

export const ARTICLE_IMAGE_WIDTH = 1600;
export const ARTICLE_IMAGE_HEIGHT = 900;
export const ARTICLE_IMAGE_ASPECT_RATIO = ARTICLE_IMAGE_WIDTH / ARTICLE_IMAGE_HEIGHT;

export type MediaFile = {
  id: string;
  name: string;
  originalName: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
  mimeType: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type MediaMetadataRecord = {
  id: string;
  originalName: string;
  fileName: string;
  url: string;
  fileSize: number | null;
  mimeType: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
};

function sanitizeBaseName(fileName: string) {
  return path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function createStoredFileName(fileName: string) {
  const baseName = sanitizeBaseName(fileName);
  return `${baseName || "image"}-${randomUUID()}.webp`;
}

function toMediaFile(record: MediaMetadataRecord): MediaFile {
  return {
    id: record.id,
    name: record.originalName,
    originalName: record.originalName,
    fileName: record.fileName,
    url: record.url,
    size: record.fileSize ?? 0,
    type: record.mimeType,
    mimeType: record.mimeType,
    altText: record.altText,
    width: record.width,
    height: record.height,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listMediaFiles(): Promise<MediaFile[]> {
  const records = await db
    .select({
      id: media.id,
      originalName: media.originalName,
      fileName: media.fileName,
      url: media.url,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      altText: media.altText,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(media.createdAt);

  return records
    .map(toMediaFile)
    .sort(
      (firstFile, secondFile) =>
        new Date(secondFile.createdAt).getTime() -
        new Date(firstFile.createdAt).getTime(),
    );
}

export async function saveMediaFile(file: File): Promise<MediaFile> {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are supported.");
  }
  if (file.size <= 0) {
    throw new Error("The selected image is empty.");
  }
  if (file.size > maximumFileSize) {
    throw new Error("The prepared image exceeds the 4 MB server upload limit.");
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const inputImage = sharp(originalBuffer, {
    failOn: "error",
  });
  const originalMetadata = await inputImage.metadata();

  if (!originalMetadata.width || !originalMetadata.height) {
    throw new Error("Image dimensions could not be detected.");
  }

  const processedBuffer = await sharp(originalBuffer, {
    failOn: "error",
  })
    .rotate()
    .resize(ARTICLE_IMAGE_WIDTH, ARTICLE_IMAGE_HEIGHT, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    })
    .webp({
      quality: 88,
      effort: 4,
    })
    .toBuffer();

  const processedMetadata = await sharp(processedBuffer).metadata();

  if (
    processedMetadata.width !== ARTICLE_IMAGE_WIDTH ||
    processedMetadata.height !== ARTICLE_IMAGE_HEIGHT
  ) {
    throw new Error(
      "Image normalization failed to produce the required 1600x900 dimensions.",
    );
  }

  const id = randomUUID();
  const storedFileName = createStoredFileName(file.name);
  const cleanTitle = path.basename(file.name, path.extname(file.name)).slice(0, 255);
  const url = `/api/media/${id}`;

  const [createdRecord] = await db
    .insert(media)
    .values({
      id,
      type: "image",
      provider: "neon-postgres",
      originalName: file.name.slice(0, 255),
      fileName: storedFileName,
      mimeType: "image/webp",
      url,
      storageKey: id,
      fileData: processedBuffer,
      altText: cleanTitle,
      title: cleanTitle,
      width: ARTICLE_IMAGE_WIDTH,
      height: ARTICLE_IMAGE_HEIGHT,
      fileSize: processedBuffer.length,
      metadata: {
        normalized: true,
        articleImage: true,
        storage: "neon-postgres-bytea",
        originalMimeType: file.type,
        originalWidth: originalMetadata.width,
        originalHeight: originalMetadata.height,
        outputWidth: ARTICLE_IMAGE_WIDTH,
        outputHeight: ARTICLE_IMAGE_HEIGHT,
        aspectRatio: "16:9",
        cropMode: "cover-centre",
        outputFormat: "webp",
      },
    })
    .returning({
      id: media.id,
      originalName: media.originalName,
      fileName: media.fileName,
      url: media.url,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      altText: media.altText,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt,
    });

  if (!createdRecord) {
    throw new Error("The media database record was not created.");
  }

  return toMediaFile(createdRecord);
}

export async function deleteMediaFile(identifier: string) {
  const cleanIdentifier = identifier.trim();
  if (!cleanIdentifier) {
    throw new Error("A valid media identifier is required.");
  }

  const [record] = await db
    .select({
      id: media.id,
      fileName: media.fileName,
      originalName: media.originalName,
    })
    .from(media)
    .where(
      or(
        eq(media.id, cleanIdentifier),
        eq(media.fileName, cleanIdentifier),
        eq(media.originalName, cleanIdentifier),
      ),
    )
    .limit(1);

  if (!record) {
    throw new Error("Media file was not found.");
  }

  const deletedRecords = await db.delete(media).where(eq(media.id, record.id)).returning({
    id: media.id,
  });

  if (deletedRecords.length === 0) {
    throw new Error("Media database record was not deleted.");
  }

  return {
    id: record.id,
    fileRemoved: true,
  };
}
