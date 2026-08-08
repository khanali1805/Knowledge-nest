import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DesignCodeRevision, DesignCodeStore } from "@/lib/design-code/types";
import { validateDesignCode } from "@/lib/design-code/validation";
const DATA_DIRECTORY = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIRECTORY, "design-code-store.json");
const RECOVERY_PATH = path.join(DATA_DIRECTORY, "design-code-store.last-valid.json");
const MAXIMUM_HISTORY_LENGTH = 30;
const MAXIMUM_STORED_CODE_LENGTH = 100_000;
export const DEFAULT_DESIGN_CODE = `
:root {
  --knowledge-nest-design-background: #ffffff;
  --knowledge-nest-design-foreground: #0f172a;
  --knowledge-nest-design-primary: #0f172a;
  --knowledge-nest-design-secondary: #334155;
  --knowledge-nest-design-accent: #2563eb;
  --knowledge-nest-design-muted: #f1f5f9;
  --knowledge-nest-design-border: #cbd5e1;
  --knowledge-nest-design-heading-font: Arial, Helvetica, sans-serif;
  --knowledge-nest-design-body-font: Arial, Helvetica, sans-serif;
  --knowledge-nest-design-radius: 1rem;
}
body {
  background: var(--knowledge-nest-design-background);
  color: var(--knowledge-nest-design-foreground);
  font-family: var(--knowledge-nest-design-body-font);
}
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--knowledge-nest-design-heading-font);
}
::selection {
  background: var(--knowledge-nest-design-accent);
  color: #ffffff;
}
`.trim();
function createRevision(
  name: string,
  code: string,
  activatedAt: string | null,
): DesignCodeRevision {
  const validation = validateDesignCode(code);
  if (!validation.valid || !validation.checksum) {
    throw new Error(validation.errors[0] ?? "Design code validation failed.");
  }
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: name.trim().slice(0, 120) || "Untitled Design",
    code: code.trim(),
    checksum: validation.checksum,
    createdAt: now,
    activatedAt,
  };
}
function createInitialStore(): DesignCodeStore {
  const now = new Date().toISOString();
  const revision = createRevision(
    "Knowledge Nest Modern Default",
    DEFAULT_DESIGN_CODE,
    now,
  );
  return {
    draftName: revision.name,
    draftCode: revision.code,
    activeRevision: revision,
    lastValidRevision: revision,
    history: [revision],
    updatedAt: now,
  };
}
function normaliseRevision(value: unknown): DesignCodeRevision | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const revision = value as Partial<DesignCodeRevision>;
  if (typeof revision.code !== "string") {
    return null;
  }
  const safeCode = revision.code.slice(0, MAXIMUM_STORED_CODE_LENGTH).trim();
  const validation = validateDesignCode(safeCode);
  if (!validation.valid || !validation.checksum) {
    return null;
  }
  return {
    id: typeof revision.id === "string" && revision.id ? revision.id : randomUUID(),
    name:
      typeof revision.name === "string"
        ? revision.name.trim().slice(0, 120) || "Untitled Design"
        : "Untitled Design",
    code: safeCode,
    checksum: validation.checksum,
    createdAt:
      typeof revision.createdAt === "string"
        ? revision.createdAt
        : new Date().toISOString(),
    activatedAt: typeof revision.activatedAt === "string" ? revision.activatedAt : null,
  };
}
function normaliseStore(value: unknown): DesignCodeStore | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const input = value as Partial<DesignCodeStore>;
  const activeRevision = normaliseRevision(input.activeRevision);
  const lastValidRevision = normaliseRevision(input.lastValidRevision) ?? activeRevision;
  if (!activeRevision || !lastValidRevision) {
    return null;
  }
  const history = Array.isArray(input.history)
    ? input.history
        .map((revision) => normaliseRevision(revision))
        .filter((revision): revision is DesignCodeRevision => revision !== null)
        .slice(0, MAXIMUM_HISTORY_LENGTH)
    : [];
  return {
    draftName:
      typeof input.draftName === "string"
        ? input.draftName.trim().slice(0, 120) || activeRevision.name
        : activeRevision.name,
    draftCode:
      typeof input.draftCode === "string"
        ? input.draftCode.slice(0, MAXIMUM_STORED_CODE_LENGTH)
        : activeRevision.code,
    activeRevision,
    lastValidRevision,
    history: history.length > 0 ? history : [activeRevision],
    updatedAt:
      typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
  };
}
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function readStoreFile(filePath: string): Promise<DesignCodeStore | null> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return normaliseStore(JSON.parse(content) as unknown);
  } catch {
    return null;
  }
}
async function writeStore(store: DesignCodeStore): Promise<void> {
  await fs.mkdir(DATA_DIRECTORY, {
    recursive: true,
  });
  const normalisedStore = normaliseStore(store);
  if (!normalisedStore) {
    throw new Error("Design Studio store validation failed.");
  }
  const temporaryPath = path.join(
    DATA_DIRECTORY,
    `design-code-store.${process.pid}.${Date.now()}.${randomUUID()}.pending.json`,
  );
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(normalisedStore, null, 2), "utf8");
    if (await fileExists(STORE_PATH)) {
      const currentStore = await readStoreFile(STORE_PATH);
      if (currentStore) {
        await fs.copyFile(STORE_PATH, RECOVERY_PATH);
      }
    }
    await fs.copyFile(temporaryPath, STORE_PATH);
    await fs.copyFile(STORE_PATH, RECOVERY_PATH);
  } finally {
    await fs.rm(temporaryPath, {
      force: true,
    });
  }
}
export async function readDesignCodeStore(): Promise<DesignCodeStore> {
  const primaryStore = await readStoreFile(STORE_PATH);
  if (primaryStore) {
    return primaryStore;
  }
  const recoveredStore = await readStoreFile(RECOVERY_PATH);
  if (recoveredStore) {
    await writeStore(recoveredStore);
    return recoveredStore;
  }
  const initialStore = createInitialStore();
  await writeStore(initialStore);
  return initialStore;
}
export async function saveDesignCodeDraft(input: {
  name: string;
  code: string;
}): Promise<DesignCodeStore> {
  if (typeof input.code !== "string" || input.code.length > MAXIMUM_STORED_CODE_LENGTH) {
    throw new Error("Design draft is too large.");
  }
  const validation = validateDesignCode(input.code);
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "Design code validation failed.");
  }
  const store = await readDesignCodeStore();
  store.draftName = input.name.trim().slice(0, 120) || "Untitled Design";
  store.draftCode = input.code.slice(0, MAXIMUM_STORED_CODE_LENGTH).trim();
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
  return store;
}
export async function activateDesignCode(input: {
  name: string;
  code: string;
}): Promise<DesignCodeStore> {
  const validation = validateDesignCode(input.code);
  if (!validation.valid || !validation.checksum) {
    throw new Error(validation.errors[0] ?? "Design code validation failed.");
  }
  const store = await readDesignCodeStore();
  const now = new Date().toISOString();
  const previousActiveRevision = store.activeRevision;
  const revision = createRevision(input.name, input.code, now);
  store.draftName = revision.name;
  store.draftCode = revision.code;
  store.lastValidRevision = previousActiveRevision;
  store.activeRevision = revision;
  store.history = [
    revision,
    ...store.history.filter(
      (historyRevision) => historyRevision.checksum !== revision.checksum,
    ),
  ].slice(0, MAXIMUM_HISTORY_LENGTH);
  store.updatedAt = now;
  await writeStore(store);
  return store;
}
export async function rollbackDesignCode(): Promise<DesignCodeStore> {
  const store = await readDesignCodeStore();
  const previousRevision = normaliseRevision(store.lastValidRevision);
  if (!previousRevision) {
    throw new Error("No valid previous design is available for rollback.");
  }
  const currentRevision = store.activeRevision;
  const now = new Date().toISOString();
  const restoredRevision: DesignCodeRevision = {
    ...previousRevision,
    id: randomUUID(),
    createdAt: now,
    activatedAt: now,
  };
  store.activeRevision = restoredRevision;
  store.lastValidRevision = currentRevision;
  store.draftName = restoredRevision.name;
  store.draftCode = restoredRevision.code;
  store.history = [restoredRevision, ...store.history].slice(0, MAXIMUM_HISTORY_LENGTH);
  store.updatedAt = now;
  await writeStore(store);
  return store;
}
export async function restoreDesignCodeRevision(
  revisionId: string,
): Promise<DesignCodeStore> {
  const store = await readDesignCodeStore();
  const selectedRevision = store.history.find((revision) => revision.id === revisionId);
  if (!selectedRevision) {
    throw new Error("Selected design revision was not found.");
  }
  const previousActiveRevision = store.activeRevision;
  const now = new Date().toISOString();
  const restoredRevision = createRevision(
    `${selectedRevision.name} Restored`,
    selectedRevision.code,
    now,
  );
  store.lastValidRevision = previousActiveRevision;
  store.activeRevision = restoredRevision;
  store.draftName = restoredRevision.name;
  store.draftCode = restoredRevision.code;
  store.history = [restoredRevision, ...store.history].slice(0, MAXIMUM_HISTORY_LENGTH);
  store.updatedAt = now;
  await writeStore(store);
  return store;
}
export async function resetDesignCode(): Promise<DesignCodeStore> {
  const store = await readDesignCodeStore();
  const previousActiveRevision = store.activeRevision;
  const now = new Date().toISOString();
  const defaultRevision = createRevision(
    "Knowledge Nest Modern Default",
    DEFAULT_DESIGN_CODE,
    now,
  );
  store.lastValidRevision = previousActiveRevision;
  store.activeRevision = defaultRevision;
  store.draftName = defaultRevision.name;
  store.draftCode = defaultRevision.code;
  store.history = [defaultRevision, ...store.history].slice(0, MAXIMUM_HISTORY_LENGTH);
  store.updatedAt = now;
  await writeStore(store);
  return store;
}
export async function getActiveDesignCode(): Promise<string> {
  const store = await readDesignCodeStore();
  return store.activeRevision.code;
}
