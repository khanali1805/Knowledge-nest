import { randomUUID } from "crypto";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";
import { eq, or } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { media } from "@/db/schema";
const localUploadDirectory = path.join(process.cwd(), "public", "uploads");
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
function getBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || null;
}
function shouldUseLocalStorage(): boolean {
  return process.env.NODE_ENV !== "production" && !getBlobToken();
}
function sanitizeBaseName(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
function createStoredFileName(fileName: string): string {
  const baseName = sanitizeBaseName(fileName);
  return `${baseName || "image"}-${randomUUID()}.webp`;
}
function toMediaFile(record: typeof media.$inferSelect): MediaFile {
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
async function ensureLocalUploadDirectory(): Promise<void> {
  await mkdir(localUploadDirectory, {
    recursive: true,
  });
}
export async function listMediaFiles(): Promise<MediaFile[]> {
  const records = await db.select().from(media).orderBy(media.createdAt);
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
    throw new Error("The selected image exceeds the 4 MB upload limit.");
  }
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const originalMetadata = await sharp(originalBuffer, {
    failOn: "error",
  }).metadata();
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
  const storedFileName = createStoredFileName(file.name);
  const cleanTitle = path.basename(file.name, path.extname(file.name)).slice(0, 255);
  let provider = "local";
  let url = "";
  let storageKey = storedFileName;
  let physicalFilePath: string | null = null;
  let uploadedBlobUrl: string | null = null;
  if (shouldUseLocalStorage()) {
    await ensureLocalUploadDirectory();
    const filePath = path.join(localUploadDirectory, storedFileName);
    await writeFile(filePath, processedBuffer, {
      flag: "wx",
    });
    const fileStats = await stat(filePath);
    if (fileStats.size <= 0) {
      await unlink(filePath).catch(() => undefined);
      throw new Error("Local image write verification failed.");
    }
    physicalFilePath = filePath;
    provider = "local";
    url = `/uploads/${encodeURIComponent(storedFileName)}`;
  } else {
    const token = getBlobToken();
    if (!token) {
      throw new Error(
        "Media storage is not configured. BLOB_READ_WRITE_TOKEN is missing from the production environment.",
      );
    }
    const blob = await put(`knowledge-nest/media/${storedFileName}`, processedBuffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
      cacheControlMaxAge: 31536000,
      token,
    });
    provider = "vercel-blob";
    url = blob.url;
    storageKey = blob.pathname;
    uploadedBlobUrl = blob.url;
  }
  try {
    const [createdRecord] = await db
      .insert(media)
      .values({
        type: "image",
        provider,
        originalName: file.name.slice(0, 255),
        fileName: storedFileName,
        mimeType: "image/webp",
        url,
        storageKey,
        altText: cleanTitle,
        title: cleanTitle,
        width: ARTICLE_IMAGE_WIDTH,
        height: ARTICLE_IMAGE_HEIGHT,
        fileSize: processedBuffer.length,
        metadata: {
          normalized: true,
          articleImage: true,
          storageProvider: provider,
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
      .returning();
    if (!createdRecord) {
      throw new Error("The media database record was not created.");
    }
    return toMediaFile(createdRecord);
  } catch (error) {
    if (uploadedBlobUrl) {
      const token = getBlobToken();
      if (token) {
        await del(uploadedBlobUrl, {
          token,
        }).catch(() => undefined);
      }
    }
    if (physicalFilePath) {
      await unlink(physicalFilePath).catch(() => undefined);
    }
    throw error;
  }
}
export async function deleteMediaFile(identifier: string): Promise<{
  id: string;
  fileRemoved: boolean;
}> {
  const cleanIdentifier = identifier.trim();
  if (!cleanIdentifier) {
    throw new Error("A valid media identifier is required.");
  }
  const [record] = await db
    .select()
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
  let fileRemoved = false;
  if (
    record.provider === "vercel-blob" ||
    record.url.includes(".blob.vercel-storage.com/")
  ) {
    const token = getBlobToken();
    if (!token) {
      throw new Error(
        "Media deletion is not configured. BLOB_READ_WRITE_TOKEN is missing from the production environment.",
      );
    }
    await del(record.url, {
      token,
    });
    fileRemoved = true;
  } else {
    const cleanFileName = path.basename(record.fileName);
    if (!cleanFileName || cleanFileName !== record.fileName) {
      throw new Error("Invalid media file path.");
    }
    const filePath = path.join(localUploadDirectory, cleanFileName);
    const relativePath = path.relative(localUploadDirectory, filePath);
    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath) ||
      cleanFileName === ".gitkeep"
    ) {
      throw new Error("Invalid media file path.");
    }
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        await unlink(filePath);
        fileRemoved = true;
        break;
      } catch (error) {
        const fileError = error as NodeJS.ErrnoException;
        if (fileError.code === "ENOENT") {
          fileRemoved = true;
          break;
        }
        const retryable =
          fileError.code === "EBUSY" ||
          fileError.code === "EPERM" ||
          fileError.code === "EACCES";
        if (!retryable || attempt === 5) {
          break;
        }
        await new Promise<void>((resolve) => {
          setTimeout(resolve, attempt * 150);
        });
      }
    }
  }
  const deletedRecords = await db.delete(media).where(eq(media.id, record.id)).returning({
    id: media.id,
  });
  if (deletedRecords.length === 0) {
    throw new Error("Media database record was not deleted.");
  }
  return {
    id: record.id,
    fileRemoved,
  };
}
