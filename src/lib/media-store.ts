import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
export type MediaRecord = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
};
type MediaStoreShape = {
  media: MediaRecord[];
};
const MEDIA_STORE_PATH = path.join(process.cwd(), "data", "media.json");
const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads");
async function ensureMediaDirectories() {
  await Promise.all([
    fs.mkdir(path.dirname(MEDIA_STORE_PATH), {
      recursive: true,
    }),
    fs.mkdir(UPLOAD_DIRECTORY, {
      recursive: true,
    }),
  ]);
}
export async function readMediaStore(): Promise<MediaRecord[]> {
  try {
    const content = await fs.readFile(MEDIA_STORE_PATH, "utf8");
    const parsed = JSON.parse(content) as MediaStoreShape | MediaRecord[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.media)) {
      return parsed.media;
    }
    return [];
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
export async function writeMediaStore(media: readonly MediaRecord[]): Promise<void> {
  await ensureMediaDirectories();
  await fs.writeFile(
    MEDIA_STORE_PATH,
    JSON.stringify(
      {
        media: [...media],
      },
      null,
      2,
    ),
    "utf8",
  );
}
function sanitiseFileName(value: string): string {
  const extension = path.extname(value);
  const baseName = path
    .basename(value, extension)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${baseName || "image"}-${Date.now()}-${crypto
    .randomUUID()
    .slice(0, 8)}${safeExtension}`;
}
export async function saveUploadedMedia(file: File): Promise<MediaRecord> {
  await ensureMediaDirectories();
  const fileName = sanitiseFileName(file.name);
  const filePath = path.join(UPLOAD_DIRECTORY, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, fileBuffer);
  const record: MediaRecord = {
    id: crypto.randomUUID(),
    name: file.name,
    url: `/uploads/${fileName}`,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    createdAt: new Date().toISOString(),
  };
  const media = await readMediaStore();
  media.unshift(record);
  await writeMediaStore(media);
  return record;
}
