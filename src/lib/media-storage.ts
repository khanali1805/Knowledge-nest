import { randomUUID } from "crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
const uploadDirectory = path.join(process.cwd(), "public", "uploads");
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const maximumFileSize = 5 * 1024 * 1024;
export type MediaFile = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
};
function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path
    .basename(fileName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${baseName || "image"}-${randomUUID()}${extension}`;
}
function getMimeType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return mimeTypes[extension] ?? "application/octet-stream";
}
export async function ensureUploadDirectory() {
  await mkdir(uploadDirectory, { recursive: true });
}
export async function listMediaFiles(): Promise<MediaFile[]> {
  await ensureUploadDirectory();
  const directoryEntries = await readdir(uploadDirectory, {
    withFileTypes: true,
  });
  const files = await Promise.all(
    directoryEntries
      .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
      .map(async (entry) => {
        const filePath = path.join(uploadDirectory, entry.name);
        const fileStats = await stat(filePath);
        return {
          id: entry.name,
          name: entry.name,
          url: `/uploads/${encodeURIComponent(entry.name)}`,
          size: fileStats.size,
          type: getMimeType(entry.name),
          createdAt: fileStats.birthtime.toISOString(),
        };
      }),
  );
  return files.sort(
    (firstFile, secondFile) =>
      new Date(secondFile.createdAt).getTime() - new Date(firstFile.createdAt).getTime(),
  );
}
export async function saveMediaFile(file: File): Promise<MediaFile> {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, WebP, GIF and SVG images are allowed.");
  }
  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > maximumFileSize) {
    throw new Error("The selected file exceeds the 5 MB size limit.");
  }
  await ensureUploadDirectory();
  const storedFileName = sanitizeFileName(file.name);
  const filePath = path.join(uploadDirectory, storedFileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, fileBuffer, {
    flag: "wx",
  });
  const fileStats = await stat(filePath);
  return {
    id: storedFileName,
    name: storedFileName,
    url: `/uploads/${encodeURIComponent(storedFileName)}`,
    size: fileStats.size,
    type: file.type,
    createdAt: fileStats.birthtime.toISOString(),
  };
}
export async function deleteMediaFile(fileName: string) {
  const cleanFileName = path.basename(fileName);
  if (!cleanFileName || cleanFileName !== fileName) {
    throw new Error("Invalid media file name.");
  }
  const filePath = path.join(uploadDirectory, cleanFileName);
  const relativePath = path.relative(uploadDirectory, filePath);
  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    cleanFileName === ".gitkeep"
  ) {
    throw new Error("Invalid media file path.");
  }
  await unlink(filePath);
}
