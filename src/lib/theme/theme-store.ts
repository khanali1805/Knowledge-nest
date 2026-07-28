import { promises as fs } from "node:fs";
import path from "node:path";
import { themePresets } from "@/lib/theme/presets";
import type {
  ThemeBackup,
  ThemeConfiguration,
  ThemeStore,
} from "@/lib/theme/types";
const themeDirectory = path.join(process.cwd(), "data");
const themeFilePath = path.join(themeDirectory, "theme-store.json");
const temporaryThemeFilePath = path.join(
  themeDirectory,
  "theme-store.pending.json",
);
function createInitialStore(): ThemeStore {
  const themes = structuredClone(themePresets);
  const activeTheme = themes.find((theme) => theme.isActive) ?? themes[0];
  return {
    activeThemeId: activeTheme.id,
    themes: themes.map((theme) => ({
      ...theme,
      isActive: theme.id === activeTheme.id,
    })),
    backups: [],
  };
}
function validateTheme(theme: ThemeConfiguration): ThemeConfiguration {
  if (!theme.id?.trim()) {
    throw new Error("Theme ID is required.");
  }
  if (!theme.name?.trim()) {
    throw new Error("Theme name is required.");
  }
  if (!theme.niche) {
    throw new Error("Theme niche is required.");
  }
  if (!theme.layout) {
    throw new Error("Theme layout is required.");
  }
  if (!theme.colours) {
    throw new Error("Theme colour configuration is required.");
  }
  if (!theme.typography) {
    throw new Error("Theme typography configuration is required.");
  }
  if (!Array.isArray(theme.sections)) {
    throw new Error("Theme sections are invalid.");
  }
  const sectionIds = new Set<string>();
  const sections = theme.sections
    .slice()
    .sort((first, second) => first.position - second.position)
    .map((section, index) => {
      if (!section.id?.trim()) {
        throw new Error("Every theme section requires an ID.");
      }
      if (sectionIds.has(section.id)) {
        throw new Error(`Duplicate theme section ID: ${section.id}`);
      }
      sectionIds.add(section.id);
      return {
        ...section,
        title: section.title.trim() || "Untitled Section",
        position: index + 1,
        articleLimit: Math.max(1, Math.min(section.articleLimit || 1, 50)),
      };
    });
  return {
    ...structuredClone(theme),
    id: theme.id.trim(),
    name: theme.name.trim(),
    version: Math.max(theme.version || 1, 1),
    sections,
    navigation: Array.from(
      new Set(
        (theme.navigation ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ),
  };
}
function normaliseStore(store: ThemeStore): ThemeStore {
  if (!Array.isArray(store.themes) || store.themes.length === 0) {
    return createInitialStore();
  }
  const themes = store.themes.map(validateTheme);
  const activeThemeExists = themes.some(
    (theme) => theme.id === store.activeThemeId,
  );
  const activeThemeId = activeThemeExists
    ? store.activeThemeId
    : themes.find((theme) => theme.isActive)?.id ?? themes[0].id;
  return {
    activeThemeId,
    themes: themes.map((theme) => ({
      ...theme,
      isActive: theme.id === activeThemeId,
    })),
    backups: Array.isArray(store.backups) ? store.backups : [],
  };
}
async function ensureThemeStore(): Promise<void> {
  await fs.mkdir(themeDirectory, {
    recursive: true,
  });
  try {
    await fs.access(themeFilePath);
  } catch {
    await writeThemeStore(createInitialStore());
  }
}
export async function writeThemeStore(store: ThemeStore): Promise<void> {
  await fs.mkdir(themeDirectory, {
    recursive: true,
  });
  const normalisedStore = normaliseStore(store);
  const content = JSON.stringify(normalisedStore, null, 2);
  await fs.writeFile(temporaryThemeFilePath, content, "utf8");
  await fs.rename(temporaryThemeFilePath, themeFilePath);
}
export async function readThemeStore(): Promise<ThemeStore> {
  await ensureThemeStore();
  try {
    const rawContent = await fs.readFile(themeFilePath, "utf8");
    const parsedStore = JSON.parse(rawContent) as ThemeStore;
    const normalisedStore = normaliseStore(parsedStore);
    if (JSON.stringify(normalisedStore) !== JSON.stringify(parsedStore)) {
      await writeThemeStore(normalisedStore);
    }
    return normalisedStore;
  } catch {
    const recoveredStore = createInitialStore();
    await writeThemeStore(recoveredStore);
    return recoveredStore;
  }
}
export async function getActiveTheme(): Promise<ThemeConfiguration> {
  const store = await readThemeStore();
  const activeTheme =
    store.themes.find((theme) => theme.id === store.activeThemeId) ??
    store.themes[0];
  if (!activeTheme) {
    throw new Error("No active theme is available.");
  }
  return activeTheme;
}
export async function saveTheme(
  theme: ThemeConfiguration,
): Promise<ThemeConfiguration> {
  const store = await readThemeStore();
  const validatedTheme = validateTheme(theme);
  const existingIndex = store.themes.findIndex(
    (existingTheme) => existingTheme.id === validatedTheme.id,
  );
  const now = new Date().toISOString();
  const nextTheme: ThemeConfiguration = {
    ...validatedTheme,
    version:
      existingIndex >= 0
        ? Math.max(
            validatedTheme.version,
            store.themes[existingIndex].version + 1,
          )
        : Math.max(validatedTheme.version, 1),
    createdAt:
      existingIndex >= 0
        ? store.themes[existingIndex].createdAt
        : validatedTheme.createdAt || now,
    updatedAt: now,
  };
  if (existingIndex >= 0) {
    store.themes[existingIndex] = nextTheme;
  } else {
    store.themes.push(nextTheme);
  }
  if (nextTheme.isActive) {
    store.activeThemeId = nextTheme.id;
  }
  store.themes = store.themes.map((storedTheme) => ({
    ...storedTheme,
    isActive: storedTheme.id === store.activeThemeId,
  }));
  await writeThemeStore(store);
  return (
    store.themes.find((storedTheme) => storedTheme.id === nextTheme.id) ??
    nextTheme
  );
}
export async function activateTheme(
  themeId: string,
): Promise<ThemeConfiguration> {
  const store = await readThemeStore();
  const selectedTheme = store.themes.find((theme) => theme.id === themeId);
  if (!selectedTheme) {
    throw new Error("Theme was not found.");
  }
  const now = new Date().toISOString();
  store.activeThemeId = themeId;
  store.themes = store.themes.map((theme) => ({
    ...theme,
    isActive: theme.id === themeId,
    updatedAt: theme.id === themeId ? now : theme.updatedAt,
  }));
  await writeThemeStore(store);
  return store.themes.find((theme) => theme.id === themeId)!;
}
export async function deleteTheme(themeId: string): Promise<void> {
  const store = await readThemeStore();
  if (store.themes.length <= 1) {
    throw new Error("The final theme cannot be deleted.");
  }
  if (store.activeThemeId === themeId) {
    throw new Error("The active theme cannot be deleted.");
  }
  const themeExists = store.themes.some((theme) => theme.id === themeId);
  if (!themeExists) {
    throw new Error("Theme was not found.");
  }
  store.themes = store.themes.filter((theme) => theme.id !== themeId);
  await writeThemeStore(store);
}
export async function createThemeBackup(
  themeId: string,
  name?: string,
): Promise<ThemeBackup> {
  const store = await readThemeStore();
  const theme = store.themes.find((storedTheme) => storedTheme.id === themeId);
  if (!theme) {
    throw new Error("Theme was not found.");
  }
  const backup: ThemeBackup = {
    id: `backup-${Date.now()}`,
    name: name?.trim() || `${theme.name} Backup`,
    createdAt: new Date().toISOString(),
    theme: structuredClone(theme),
  };
  store.backups.unshift(backup);
  store.backups = store.backups.slice(0, 50);
  await writeThemeStore(store);
  return backup;
}
export async function restoreThemeBackup(
  backupId: string,
): Promise<ThemeConfiguration> {
  const store = await readThemeStore();
  const backup = store.backups.find(
    (storedBackup) => storedBackup.id === backupId,
  );
  if (!backup) {
    throw new Error("Theme backup was not found.");
  }
  const now = new Date().toISOString();
  const restoredTheme = validateTheme({
    ...structuredClone(backup.theme),
    id: `${backup.theme.niche}-restored-${Date.now()}`,
    name: `${backup.theme.name} Restored`,
    isActive: false,
    version: backup.theme.version + 1,
    createdAt: now,
    updatedAt: now,
  });
  store.themes.push(restoredTheme);
  await writeThemeStore(store);
  return restoredTheme;
}