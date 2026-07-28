"use client";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  GripVertical,
  LoaderCircle,
  Monitor,
  Palette,
  Plus,
  RefreshCcw,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ThemeBackup,
  ThemeConfiguration,
  ThemeDevice,
  ThemeNiche,
  ThemeSection,
  ThemeStore,
} from "@/lib/theme/types";
const niches: Array<{
  value: ThemeNiche;
  label: string;
}> = [
  { value: "general", label: "General Blog" },
  { value: "news", label: "News" },
  { value: "finance", label: "Finance" },
  { value: "technology", label: "Technology" },
  { value: "ai", label: "Artificial Intelligence" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "science", label: "Science" },
  { value: "fashion", label: "Fashion" },
  { value: "beauty", label: "Beauty" },
  { value: "cars", label: "Cars" },
  { value: "sports", label: "Sports" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "gaming", label: "Gaming" },
  { value: "entertainment", label: "Entertainment" },
  { value: "real-estate", label: "Real Estate" },
  { value: "agriculture", label: "Agriculture" },
  { value: "lifestyle", label: "Lifestyle" },
];
type ApiResponse = Partial<ThemeStore> & {
  theme?: ThemeConfiguration;
  backup?: ThemeBackup;
  message?: string;
};
function createThemeFile(theme: ThemeConfiguration) {
  return new Blob([JSON.stringify(theme, null, 2)], {
    type: "application/json",
  });
}
function normaliseSectionPositions(sections: ThemeSection[]): ThemeSection[] {
  return sections.map((section, index) => ({
    ...section,
    position: index + 1,
  }));
}
export function ThemeStudio() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [store, setStore] = useState<ThemeStore | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<ThemeNiche>("general");
  const [device, setDevice] = useState<ThemeDevice>("desktop");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState(
    "Create a modern premium publication with clear typography",
  );
  const [draggedSectionId, setDraggedSectionId] = useState("");
  const selectedTheme = useMemo(
    () =>
      store?.themes.find((theme) => theme.id === selectedThemeId) ??
      store?.themes[0] ??
      null,
    [selectedThemeId, store],
  );
  const loadStore = useCallback(async (preferredThemeId?: string) => {
    setError("");
    const response = await fetch("/api/admin/themes", {
      cache: "no-store",
    });
    const responseData = (await response.json()) as ApiResponse;
    if (!response.ok || !responseData.themes) {
      throw new Error(responseData.message || "Unable to load themes.");
    }
    const nextStore: ThemeStore = {
      activeThemeId: responseData.activeThemeId ?? "",
      themes: responseData.themes,
      backups: responseData.backups ?? [],
    };
    setStore(nextStore);
    setSelectedThemeId((currentThemeId) => {
      const requestedId =
        preferredThemeId ||
        currentThemeId ||
        nextStore.activeThemeId ||
        nextStore.themes[0]?.id ||
        "";
      const requestedThemeExists = nextStore.themes.some(
        (theme) => theme.id === requestedId,
      );
      return requestedThemeExists
        ? requestedId
        : nextStore.activeThemeId || nextStore.themes[0]?.id || "";
    });
  }, []);
  useEffect(() => {
    async function initialise() {
      try {
        await loadStore();
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load themes.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    void initialise();
  }, [loadStore]);
  async function runAction(
    actionName: string,
    payload: Record<string, unknown>,
    preferredThemeId?: string,
    endpoint = "/api/admin/themes",
  ) {
    setBusyAction(actionName);
    setMessage("");
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responseData = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to update the theme.");
      }
      const nextThemeId = responseData.theme?.id || preferredThemeId || selectedThemeId;
      await loadStore(nextThemeId);
      setMessage("Theme changes saved successfully.");
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update the theme.",
      );
    } finally {
      setBusyAction("");
    }
  }
  function updateSelectedTheme(
    updater: (theme: ThemeConfiguration) => ThemeConfiguration,
  ) {
    if (!store || !selectedTheme) {
      return;
    }
    setStore({
      ...store,
      themes: store.themes.map((theme) =>
        theme.id === selectedTheme.id ? updater(theme) : theme,
      ),
    });
  }
  function reorderSections(sourceSectionId: string, targetSectionId: string) {
    if (!selectedTheme || sourceSectionId === targetSectionId) {
      return;
    }
    const sortedSections = selectedTheme.sections
      .slice()
      .sort((first, second) => first.position - second.position);
    const sourceIndex = sortedSections.findIndex(
      (section) => section.id === sourceSectionId,
    );
    const targetIndex = sortedSections.findIndex(
      (section) => section.id === targetSectionId,
    );
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const [movedSection] = sortedSections.splice(sourceIndex, 1);
    sortedSections.splice(targetIndex, 0, movedSection);
    updateSelectedTheme((theme) => ({
      ...theme,
      sections: normaliseSectionPositions(sortedSections),
    }));
  }
  function moveSection(sectionId: string, direction: "up" | "down") {
    if (!selectedTheme) {
      return;
    }
    const sortedSections = selectedTheme.sections
      .slice()
      .sort((first, second) => first.position - second.position);
    const sourceIndex = sortedSections.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === "up" ? sourceIndex - 1 : sourceIndex + 1;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= sortedSections.length) {
      return;
    }
    const targetSection = sortedSections[targetIndex];
    reorderSections(sectionId, targetSection.id);
  }
  function handleDragStart(event: DragEvent<HTMLDivElement>, sectionId: string) {
    setDraggedSectionId(sectionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", sectionId);
  }
  function handleDrop(event: DragEvent<HTMLDivElement>, targetSectionId: string) {
    event.preventDefault();
    const sourceSectionId = event.dataTransfer.getData("text/plain") || draggedSectionId;
    reorderSections(sourceSectionId, targetSectionId);
    setDraggedSectionId("");
  }
  async function createTheme() {
    await runAction("create", {
      action: "create",
      niche: selectedNiche,
    });
  }
  async function saveSelectedTheme() {
    if (!selectedTheme) {
      return;
    }
    await runAction(
      "save",
      {
        action: "save",
        theme: selectedTheme,
      },
      selectedTheme.id,
    );
  }
  async function generateAiTheme() {
    if (!selectedTheme) {
      return;
    }
    await runAction(
      "generate",
      {
        prompt: aiPrompt,
        theme: selectedTheme,
      },
      undefined,
      "/api/admin/themes/generate",
    );
  }
  async function activateSelectedTheme() {
    if (!selectedTheme) {
      return;
    }
    await runAction(
      "activate",
      {
        action: "activate",
        themeId: selectedTheme.id,
      },
      selectedTheme.id,
    );
  }
  async function deleteSelectedTheme() {
    if (!selectedTheme || selectedTheme.isActive) {
      return;
    }
    const confirmed = window.confirm(`Delete "${selectedTheme.name}" permanently?`);
    if (!confirmed) {
      return;
    }
    await runAction("delete", {
      action: "delete",
      themeId: selectedTheme.id,
    });
  }
  async function backupSelectedTheme() {
    if (!selectedTheme) {
      return;
    }
    await runAction(
      "backup",
      {
        action: "backup",
        themeId: selectedTheme.id,
      },
      selectedTheme.id,
    );
  }
  async function restoreBackup(backupId: string) {
    await runAction("restore", {
      action: "restore",
      backupId,
    });
  }
  function exportSelectedTheme() {
    if (!selectedTheme) {
      return;
    }
    const url = URL.createObjectURL(createThemeFile(selectedTheme));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedTheme.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  async function importTheme(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setBusyAction("import");
    setMessage("");
    setError("");
    try {
      const content = await file.text();
      const theme = JSON.parse(content) as ThemeConfiguration;
      if (
        !theme.name ||
        !theme.niche ||
        !theme.colours ||
        !theme.typography ||
        !Array.isArray(theme.sections)
      ) {
        throw new Error("The selected theme file is invalid.");
      }
      await runAction("import", {
        action: "import",
        theme,
      });
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Unable to import the theme.",
      );
    } finally {
      setBusyAction("");
      event.target.value = "";
    }
  }
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <LoaderCircle className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!store || !selectedTheme) {
    return (
      <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-xl border p-5 text-sm">
        {error || "No themes are available."}
      </div>
    );
  }
  const previewWidth =
    device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px";
  const orderedSections = selectedTheme.sections
    .slice()
    .sort((first, second) => first.position - second.position);
  return (
    <div className="space-y-6">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        onChange={(event) => void importTheme(event)}
        className="hidden"
      />
      <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium">Current Theme</label>
            <select
              value={selectedTheme.id}
              onChange={(event) => setSelectedThemeId(event.target.value)}
              className="border-border bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
            >
              {store.themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                  {theme.isActive ? " — Active" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">New Theme Niche</label>
            <div className="flex gap-2">
              <select
                value={selectedNiche}
                onChange={(event) => setSelectedNiche(event.target.value as ThemeNiche)}
                className="border-border bg-background min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm"
              >
                {niches.map((niche) => (
                  <option key={niche.value} value={niche.value}>
                    {niche.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void createTheme()}
                disabled={Boolean(busyAction)}
                className="bg-foreground text-background inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveSelectedTheme()}
              disabled={Boolean(busyAction)}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => void activateSelectedTheme()}
              disabled={Boolean(busyAction) || selectedTheme.isActive}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Activate
            </button>
            <button
              type="button"
              onClick={() => void backupSelectedTheme()}
              disabled={Boolean(busyAction)}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Backup
            </button>
            <button
              type="button"
              onClick={exportSelectedTheme}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={Boolean(busyAction)}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => void deleteSelectedTheme()}
              disabled={Boolean(busyAction) || selectedTheme.isActive}
              className="border-border text-destructive hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </section>
      <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-semibold">AI Theme Generator</h2>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <textarea
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            rows={3}
            placeholder="Describe the colours, typography and layout you want."
            className="border-border bg-background min-h-24 flex-1 rounded-lg border px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => void generateAiTheme()}
            disabled={Boolean(busyAction) || !aiPrompt.trim()}
            className="bg-foreground text-background inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busyAction === "generate" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Theme
          </button>
        </div>
      </section>
      {message ? (
        <div className="border-border bg-background rounded-lg border px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 2xl:grid-cols-[430px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <h2 className="font-semibold">Theme Settings</h2>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Theme Name</label>
                <input
                  value={selectedTheme.name}
                  onChange={(event) =>
                    updateSelectedTheme((theme) => ({
                      ...theme,
                      name: event.target.value,
                    }))
                  }
                  className="border-border bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Layout</label>
                <select
                  value={selectedTheme.layout}
                  onChange={(event) =>
                    updateSelectedTheme((theme) => ({
                      ...theme,
                      layout: event.target.value as ThemeConfiguration["layout"],
                    }))
                  }
                  className="border-border bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
                >
                  <option value="editorial">Editorial</option>
                  <option value="magazine">Magazine</option>
                  <option value="grid">Grid</option>
                  <option value="minimal">Minimal</option>
                  <option value="business">Business</option>
                  <option value="visual">Visual</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Navigation Items</label>
                <textarea
                  value={selectedTheme.navigation.join("\n")}
                  onChange={(event) =>
                    updateSelectedTheme((theme) => ({
                      ...theme,
                      navigation: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  rows={7}
                  className="border-border bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedTheme.colours).map(
                  ([colourName, colourValue]) => (
                    <label key={colourName} className="text-sm font-medium capitalize">
                      {colourName}
                      <div className="border-border mt-2 flex items-center gap-2 rounded-lg border p-2">
                        <input
                          type="color"
                          value={colourValue}
                          onChange={(event) =>
                            updateSelectedTheme((theme) => ({
                              ...theme,
                              colours: {
                                ...theme.colours,
                                [colourName]: event.target.value,
                              },
                            }))
                          }
                          className="h-8 w-10 cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-muted-foreground truncate text-xs">
                          {colourValue}
                        </span>
                      </div>
                    </label>
                  ),
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Heading Font</label>
                  <input
                    value={selectedTheme.typography.headingFont}
                    onChange={(event) =>
                      updateSelectedTheme((theme) => ({
                        ...theme,
                        typography: {
                          ...theme.typography,
                          headingFont: event.target.value,
                        },
                      }))
                    }
                    className="border-border bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Body Font</label>
                  <input
                    value={selectedTheme.typography.bodyFont}
                    onChange={(event) =>
                      updateSelectedTheme((theme) => ({
                        ...theme,
                        typography: {
                          ...theme.typography,
                          bodyFont: event.target.value,
                        },
                      }))
                    }
                    className="border-border bg-background w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Drag and Drop Homepage Sections</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Drag sections or use the arrow buttons to change homepage positions.
            </p>
            <div className="mt-4 space-y-3">
              {orderedSections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, section.id)}
                  className={`border-border rounded-lg border p-3 ${
                    draggedSectionId === section.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="text-muted-foreground h-5 w-5 cursor-grab" />
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(event) =>
                        updateSelectedTheme((theme) => ({
                          ...theme,
                          sections: theme.sections.map((storedSection) =>
                            storedSection.id === section.id
                              ? {
                                  ...storedSection,
                                  enabled: event.target.checked,
                                }
                              : storedSection,
                          ),
                        }))
                      }
                    />
                    <input
                      value={section.title}
                      onChange={(event) =>
                        updateSelectedTheme((theme) => ({
                          ...theme,
                          sections: theme.sections.map((storedSection) =>
                            storedSection.id === section.id
                              ? {
                                  ...storedSection,
                                  title: event.target.value,
                                }
                              : storedSection,
                          ),
                        }))
                      }
                      className="border-border bg-background min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, "up")}
                      disabled={sectionIndex === 0}
                      className="border-border rounded-md border p-1.5 disabled:opacity-30"
                      aria-label="Move section up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, "down")}
                      disabled={sectionIndex === orderedSections.length - 1}
                      className="border-border rounded-md border p-1.5 disabled:opacity-30"
                      aria-label="Move section down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Theme Backups</h2>
            {store.backups.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">
                No theme backups have been created.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {store.backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{backup.name}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Date(backup.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void restoreBackup(backup.id)}
                      disabled={Boolean(busyAction)}
                      className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <section className="border-border bg-muted/30 overflow-hidden rounded-xl border shadow-sm">
          <div className="border-border bg-background flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Live Preview</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {selectedTheme.name} · Version {selectedTheme.version}
              </p>
            </div>
            <div className="border-border bg-muted inline-flex rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`rounded-md p-2 ${
                  device === "desktop" ? "bg-background shadow-sm" : ""
                }`}
                aria-label="Desktop preview"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={`rounded-md p-2 ${
                  device === "tablet" ? "bg-background shadow-sm" : ""
                }`}
                aria-label="Tablet preview"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`rounded-md p-2 ${
                  device === "mobile" ? "bg-background shadow-sm" : ""
                }`}
                aria-label="Mobile preview"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-auto p-4 sm:p-6">
            <div
              className="mx-auto min-h-[700px] overflow-hidden rounded-xl shadow-xl transition-all"
              style={{
                width: previewWidth,
                maxWidth: "100%",
                backgroundColor: selectedTheme.colours.background,
                color: selectedTheme.colours.foreground,
                fontFamily: selectedTheme.typography.bodyFont,
              }}
            >
              <header
                className="border-b px-5 py-4"
                style={{
                  borderColor: selectedTheme.colours.border,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <h1
                    className="text-xl font-bold"
                    style={{
                      color: selectedTheme.colours.primary,
                      fontFamily: selectedTheme.typography.headingFont,
                    }}
                  >
                    {selectedTheme.name}
                  </h1>
                  <nav className="hidden gap-4 text-xs md:flex">
                    {selectedTheme.navigation.slice(0, 5).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </nav>
                </div>
              </header>
              <main className="space-y-8 p-5">
                {orderedSections
                  .filter((section) => section.enabled)
                  .map((section) => (
                    <section key={section.id}>
                      <h2
                        className="mb-4 text-lg font-bold"
                        style={{
                          fontFamily: selectedTheme.typography.headingFont,
                        }}
                      >
                        {section.title}
                      </h2>
                      {section.type === "hero" ? (
                        <div
                          className="rounded-xl p-8"
                          style={{
                            backgroundColor: selectedTheme.colours.primary,
                            color: selectedTheme.colours.background,
                          }}
                        >
                          <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
                            Featured Story
                          </p>
                          <h3 className="mt-3 max-w-2xl text-3xl font-bold">
                            Dynamic content designed for the {selectedTheme.niche} niche
                          </h3>
                          <p className="mt-4 max-w-xl text-sm opacity-80">
                            Navigation, sections, colours, typography and layouts follow
                            the selected active theme.
                          </p>
                        </div>
                      ) : section.type === "newsletter" ? (
                        <div
                          className="rounded-xl p-6"
                          style={{
                            backgroundColor: selectedTheme.colours.muted,
                          }}
                        >
                          <h3 className="font-bold">Subscribe to the newsletter</h3>
                          <div className="mt-4 flex gap-2">
                            <div
                              className="h-10 flex-1 rounded-lg border"
                              style={{
                                borderColor: selectedTheme.colours.border,
                                backgroundColor: selectedTheme.colours.background,
                              }}
                            />
                            <div
                              className="h-10 w-28 rounded-lg"
                              style={{
                                backgroundColor: selectedTheme.colours.primary,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`grid gap-4 ${
                            selectedTheme.layout === "minimal"
                              ? "grid-cols-1"
                              : "sm:grid-cols-2 lg:grid-cols-3"
                          }`}
                        >
                          {Array.from({
                            length: Math.min(section.articleLimit || 3, 6),
                          }).map((_, index) => (
                            <article
                              key={index}
                              className="overflow-hidden rounded-xl border"
                              style={{
                                borderColor: selectedTheme.colours.border,
                              }}
                            >
                              <div
                                className="aspect-video"
                                style={{
                                  backgroundColor:
                                    index % 2 === 0
                                      ? selectedTheme.colours.secondary
                                      : selectedTheme.colours.accent,
                                }}
                              />
                              <div className="p-4">
                                <p
                                  className="text-xs font-semibold uppercase"
                                  style={{
                                    color: selectedTheme.colours.primary,
                                  }}
                                >
                                  {selectedTheme.niche}
                                </p>
                                <h3 className="mt-2 font-bold">
                                  Example article title for this theme
                                </h3>
                                <p className="mt-2 text-xs opacity-70">
                                  Preview article cards using the selected colours and
                                  layout.
                                </p>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
              </main>
              <footer
                className="border-t px-5 py-8 text-center text-xs"
                style={{
                  borderColor: selectedTheme.colours.border,
                  backgroundColor: selectedTheme.colours.muted,
                }}
              >
                Dynamic footer for {selectedTheme.name}
              </footer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}








