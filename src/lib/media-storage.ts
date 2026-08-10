import { eq, or } from "drizzle-orm";
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
  const processedBuffer = Buffer.from(await file.arrayBuffer());
  if (processedBuffer.length === 0) {
    throw new Error("The uploaded image contains no data.");
  }
  if (processedBuffer.length > maximumFileSize) {
    throw new Error("The prepared image exceeds the 4 MB server storage limit.");
  }
  const id = crypto.randomUUID();
  const baseName =
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 180) || "image";
  const storedFileName = `${baseName}-${id}.webp`;
  const url = `/api/media/${id}`;
  const cleanTitle =
    baseName.replace(/[-_]+/g, " ").trim().slice(0, 255) || "Article image";
  const [record] = await db
    .insert(media)
    .values({
      id,
      type: "image",
      provider: "neon-postgres",
      originalName: file.name.slice(0, 255),
      fileName: storedFileName,
      mimeType: file.type || "image/webp",
      url,
      storageKey: id,
      fileData: processedBuffer,
      altText: cleanTitle,
      title: cleanTitle,
      fileSize: processedBuffer.length,
      metadata: {
        normalizedClientSide: true,
        articleImage: true,
        storage: "neon-postgres-bytea",
        serverImageProcessing: false,
        serverProcessor: "none",
        outputFormat: file.type || "image/webp",
      },
      updatedAt: new Date(),
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
  if (!record) {
    throw new Error("Media database insert did not return a record.");
  }
  return {
    id: record.id,
    name: record.originalName,
    originalName: record.originalName,
    fileName: record.fileName,
    url: record.url,
    size: record.fileSize ?? processedBuffer.length,
    type: record.mimeType,
    mimeType: record.mimeType,
    altText: record.altText ?? "",
    width: record.width,
    height: record.height,
    createdAt: record.createdAt.toISOString(),
  };
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
