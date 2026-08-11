import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { designCodeRevisions, designCodeState } from "@/db/schema";
import type { DesignCodeRevision, DesignCodeStore } from "@/lib/design-code/types";
import { validateDesignCode } from "@/lib/design-code/validation";
const DESIGN_STATE_ID = "knowledge-nest-design";
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
type RevisionRow = typeof designCodeRevisions.$inferSelect;
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
function rowToRevision(row: RevisionRow): DesignCodeRevision {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    checksum: row.checksum,
    createdAt: row.createdAt.toISOString(),
    activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
  };
}
async function loadRevision(id: string | null): Promise<DesignCodeRevision | null> {
  if (!id) {
    return null;
  }
  const [row] = await db
    .select()
    .from(designCodeRevisions)
    .where(eq(designCodeRevisions.id, id))
    .limit(1);
  return row ? rowToRevision(row) : null;
}
async function createInitialDatabaseStore(): Promise<DesignCodeStore> {
  const now = new Date().toISOString();
  const revision = createRevision(
    "Knowledge Nest Modern Default",
    DEFAULT_DESIGN_CODE,
    now,
  );
  await db.transaction(async (transaction) => {
    await transaction.insert(designCodeRevisions).values({
      id: revision.id,
      name: revision.name,
      code: revision.code,
      checksum: revision.checksum,
      isActive: true,
      createdAt: new Date(revision.createdAt),
      activatedAt: revision.activatedAt ? new Date(revision.activatedAt) : null,
    });
    await transaction.insert(designCodeState).values({
      id: DESIGN_STATE_ID,
      draftName: revision.name,
      draftCode: revision.code,
      activeRevisionId: revision.id,
      lastValidRevisionId: revision.id,
      updatedAt: new Date(now),
    });
  });
  return {
    draftName: revision.name,
    draftCode: revision.code,
    activeRevision: revision,
    lastValidRevision: revision,
    history: [revision],
    updatedAt: now,
  };
}
export async function readDesignCodeStore(): Promise<DesignCodeStore> {
  const [state] = await db
    .select()
    .from(designCodeState)
    .where(eq(designCodeState.id, DESIGN_STATE_ID))
    .limit(1);
  if (!state) {
    return createInitialDatabaseStore();
  }
  const [activeRevision, lastValidRevision, historyRows] = await Promise.all([
    loadRevision(state.activeRevisionId),
    loadRevision(state.lastValidRevisionId),
    db
      .select()
      .from(designCodeRevisions)
      .orderBy(desc(designCodeRevisions.createdAt))
      .limit(MAXIMUM_HISTORY_LENGTH),
  ]);
  if (!activeRevision) {
    throw new Error("Design Studio active revision is missing from database.");
  }
  if (!lastValidRevision) {
    throw new Error("Design Studio last valid revision is missing from database.");
  }
  return {
    draftName: state.draftName,
    draftCode: state.draftCode,
    activeRevision,
    lastValidRevision,
    history: historyRows.map(rowToRevision),
    updatedAt: state.updatedAt.toISOString(),
  };
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
  const draftName = input.name.trim().slice(0, 120) || "Untitled Design";
  const draftCode = input.code.slice(0, MAXIMUM_STORED_CODE_LENGTH).trim();
  await db
    .update(designCodeState)
    .set({
      draftName,
      draftCode,
      updatedAt: new Date(),
    })
    .where(eq(designCodeState.id, DESIGN_STATE_ID));
  return readDesignCodeStore();
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
  const revision = createRevision(input.name, input.code, now);
  await db.transaction(async (transaction) => {
    await transaction
      .update(designCodeRevisions)
      .set({
        isActive: false,
      })
      .where(eq(designCodeRevisions.isActive, true));
    await transaction.insert(designCodeRevisions).values({
      id: revision.id,
      name: revision.name,
      code: revision.code,
      checksum: revision.checksum,
      isActive: true,
      createdAt: new Date(revision.createdAt),
      activatedAt: revision.activatedAt ? new Date(revision.activatedAt) : null,
    });
    await transaction
      .update(designCodeState)
      .set({
        draftName: revision.name,
        draftCode: revision.code,
        activeRevisionId: revision.id,
        lastValidRevisionId: store.activeRevision.id,
        updatedAt: new Date(now),
      })
      .where(eq(designCodeState.id, DESIGN_STATE_ID));
  });
  return readDesignCodeStore();
}
export async function rollbackDesignCode(): Promise<DesignCodeStore> {
  const store = await readDesignCodeStore();
  const previousRevision = store.lastValidRevision;
  const now = new Date().toISOString();
  const restoredRevision = createRevision(
    previousRevision.name,
    previousRevision.code,
    now,
  );
  await db.transaction(async (transaction) => {
    await transaction
      .update(designCodeRevisions)
      .set({
        isActive: false,
      })
      .where(eq(designCodeRevisions.isActive, true));
    await transaction.insert(designCodeRevisions).values({
      id: restoredRevision.id,
      name: restoredRevision.name,
      code: restoredRevision.code,
      checksum: restoredRevision.checksum,
      isActive: true,
      createdAt: new Date(restoredRevision.createdAt),
      activatedAt: restoredRevision.activatedAt
        ? new Date(restoredRevision.activatedAt)
        : null,
    });
    await transaction
      .update(designCodeState)
      .set({
        draftName: restoredRevision.name,
        draftCode: restoredRevision.code,
        activeRevisionId: restoredRevision.id,
        lastValidRevisionId: store.activeRevision.id,
        updatedAt: new Date(now),
      })
      .where(eq(designCodeState.id, DESIGN_STATE_ID));
  });
  return readDesignCodeStore();
}
export async function restoreDesignCodeRevision(
  revisionId: string,
): Promise<DesignCodeStore> {
  const store = await readDesignCodeStore();
  const [selectedRow] = await db
    .select()
    .from(designCodeRevisions)
    .where(eq(designCodeRevisions.id, revisionId))
    .limit(1);
  if (!selectedRow) {
    throw new Error("Selected design revision was not found.");
  }
  const selectedRevision = rowToRevision(selectedRow);
  const now = new Date().toISOString();
  const restoredRevision = createRevision(
    `${selectedRevision.name} Restored`,
    selectedRevision.code,
    now,
  );
  await db.transaction(async (transaction) => {
    await transaction
      .update(designCodeRevisions)
      .set({
        isActive: false,
      })
      .where(eq(designCodeRevisions.isActive, true));
    await transaction.insert(designCodeRevisions).values({
      id: restoredRevision.id,
      name: restoredRevision.name,
      code: restoredRevision.code,
      checksum: restoredRevision.checksum,
      isActive: true,
      createdAt: new Date(restoredRevision.createdAt),
      activatedAt: restoredRevision.activatedAt
        ? new Date(restoredRevision.activatedAt)
        : null,
    });
    await transaction
      .update(designCodeState)
      .set({
        draftName: restoredRevision.name,
        draftCode: restoredRevision.code,
        activeRevisionId: restoredRevision.id,
        lastValidRevisionId: store.activeRevision.id,
        updatedAt: new Date(now),
      })
      .where(eq(designCodeState.id, DESIGN_STATE_ID));
  });
  return readDesignCodeStore();
}
export async function resetDesignCode(): Promise<DesignCodeStore> {
  const store = await readDesignCodeStore();
  const now = new Date().toISOString();
  const defaultRevision = createRevision(
    "Knowledge Nest Modern Default",
    DEFAULT_DESIGN_CODE,
    now,
  );
  await db.transaction(async (transaction) => {
    await transaction
      .update(designCodeRevisions)
      .set({
        isActive: false,
      })
      .where(eq(designCodeRevisions.isActive, true));
    await transaction.insert(designCodeRevisions).values({
      id: defaultRevision.id,
      name: defaultRevision.name,
      code: defaultRevision.code,
      checksum: defaultRevision.checksum,
      isActive: true,
      createdAt: new Date(defaultRevision.createdAt),
      activatedAt: defaultRevision.activatedAt
        ? new Date(defaultRevision.activatedAt)
        : null,
    });
    await transaction
      .update(designCodeState)
      .set({
        draftName: defaultRevision.name,
        draftCode: defaultRevision.code,
        activeRevisionId: defaultRevision.id,
        lastValidRevisionId: store.activeRevision.id,
        updatedAt: new Date(now),
      })
      .where(eq(designCodeState.id, DESIGN_STATE_ID));
  });
  return readDesignCodeStore();
}
export async function getActiveDesignCode(): Promise<string> {
  const store = await readDesignCodeStore();
  return store.activeRevision.code;
}
