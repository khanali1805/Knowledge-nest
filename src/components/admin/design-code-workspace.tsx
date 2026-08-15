"use client";
import {
  CheckCircle2,
  Code2,
  Eye,
  History,
  LoaderCircle,
  Monitor,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Tablet,
  Undo2,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type {
  DesignCodeStore,
  DesignCodeValidationResult,
} from "@/lib/design-code/types";
type DesignCodeWorkspaceProps = {
  initialStore: DesignCodeStore;
};
type DesignCodeApiResponse = {
  success?: boolean;
  store?: DesignCodeStore;
  validation?: DesignCodeValidationResult;
  message?: string;
};
type DesignAction = "validate" | "save" | "activate" | "rollback" | "restore" | "reset";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type ThemePreset = {
  name: string;
  description: string;
  variables: Record<string, string>;
};
const themePresets: ThemePreset[] = [
  {
    name: "Knowledge Nest Lavender",
    description: "Soft lavender, violet accents and a clean white reading experience.",
    variables: {
      "--knowledge-nest-design-background": "#ffffff",
      "--knowledge-nest-design-foreground": "#1e1b4b",
      "--knowledge-nest-design-primary": "#5b21b6",
      "--knowledge-nest-design-secondary": "#7c3aed",
      "--knowledge-nest-design-accent": "#8b5cf6",
      "--knowledge-nest-design-muted": "#f5f3ff",
      "--knowledge-nest-design-border": "#ddd6fe",
      "--knowledge-nest-design-heading-font": '"Inter", Arial, Helvetica, sans-serif',
      "--knowledge-nest-design-body-font": '"Inter", Arial, Helvetica, sans-serif',
      "--knowledge-nest-design-radius": "1.25rem",
    },
  },
  {
    name: "Modern Neutral",
    description: "Clean slate typography with a restrained blue accent.",
    variables: {
      "--knowledge-nest-design-background": "#ffffff",
      "--knowledge-nest-design-foreground": "#0f172a",
      "--knowledge-nest-design-primary": "#0f172a",
      "--knowledge-nest-design-secondary": "#334155",
      "--knowledge-nest-design-accent": "#2563eb",
      "--knowledge-nest-design-muted": "#f1f5f9",
      "--knowledge-nest-design-border": "#cbd5e1",
      "--knowledge-nest-design-heading-font": "Arial, Helvetica, sans-serif",
      "--knowledge-nest-design-body-font": "Arial, Helvetica, sans-serif",
      "--knowledge-nest-design-radius": "1rem",
    },
  },
];
const colourControls = [
  {
    variable: "--knowledge-nest-design-background",
    label: "Background",
    fallback: "#ffffff",
  },
  {
    variable: "--knowledge-nest-design-foreground",
    label: "Text",
    fallback: "#0f172a",
  },
  {
    variable: "--knowledge-nest-design-primary",
    label: "Primary",
    fallback: "#5b21b6",
  },
  {
    variable: "--knowledge-nest-design-secondary",
    label: "Secondary",
    fallback: "#7c3aed",
  },
  {
    variable: "--knowledge-nest-design-accent",
    label: "Accent",
    fallback: "#8b5cf6",
  },
  {
    variable: "--knowledge-nest-design-muted",
    label: "Muted",
    fallback: "#f5f3ff",
  },
  {
    variable: "--knowledge-nest-design-border",
    label: "Border",
    fallback: "#ddd6fe",
  },
] as const;
const fontOptions = [
  {
    label: "Inter / Modern Sans",
    value: '"Inter", Arial, Helvetica, sans-serif',
  },
  {
    label: "Arial / Clean Sans",
    value: "Arial, Helvetica, sans-serif",
  },
  {
    label: "Georgia / Editorial Serif",
    value: 'Georgia, "Times New Roman", serif',
  },
  {
    label: "System UI",
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
] as const;
const radiusOptions = [
  {
    label: "Sharp",
    value: "0.25rem",
  },
  {
    label: "Soft",
    value: "0.75rem",
  },
  {
    label: "Rounded",
    value: "1rem",
  },
  {
    label: "Lavender Soft",
    value: "1.25rem",
  },
  {
    label: "Extra Rounded",
    value: "1.75rem",
  },
] as const;
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function readCssVariable(code: string, variableName: string, fallback = "") {
  const pattern = new RegExp(`${escapeRegExp(variableName)}\\s*:\\s*([^;]+);`, "i");
  const match = code.match(pattern);
  return match?.[1]?.trim() || fallback;
}
function writeCssVariable(code: string, variableName: string, value: string) {
  const pattern = new RegExp(`(${escapeRegExp(variableName)}\\s*:\\s*)([^;]+)(;)`, "i");
  if (pattern.test(code)) {
    return code.replace(pattern, `$1${value}$3`);
  }
  const rootPattern = /:root\s*\{/i;
  if (rootPattern.test(code)) {
    return code.replace(rootPattern, `:root {\n  ${variableName}: ${value};`);
  }
  return `:root {\n  ${variableName}: ${value};\n}\n\n${code}`;
}
function applyThemeVariables(code: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (currentCode, [variableName, value]) =>
      writeCssVariable(currentCode, variableName, value),
    code,
  );
}
const previewWidths: Record<PreviewDevice, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};
const previewTargets = [
  {
    label: "Homepage",
    path: "/",
  },
  {
    label: "Latest Articles",
    path: "/latest",
  },
  {
    label: "Featured Articles",
    path: "/featured",
  },
  {
    label: "Popular Articles",
    path: "/popular",
  },
  {
    label: "Search",
    path: "/search",
  },
  {
    label: "Article - Skin Confidence",
    path: "/article/expert-guide-to-skin-confidence-feeling-beautiful-in-a-filtered-world",
  },
  {
    label: "Category - Beauty & Skincare",
    path: "/category/beauty-skincare",
  },
  {
    label: "Category - Women's Fashion & Style",
    path: "/category/womens-fashion-style",
  },
  {
    label: "Category - Health, Fitness & Wellness",
    path: "/category/health-fitness-wellness",
  },
  {
    label: "Category - Travel & Lifestyle",
    path: "/category/travel-lifestyle",
  },
  {
    label: "About Us",
    path: "/about-us",
  },
  {
    label: "Contact Us",
    path: "/contact-us",
  },
  {
    label: "Privacy Policy",
    path: "/privacy-policy",
  },
  {
    label: "Terms and Conditions",
    path: "/terms-and-conditions",
  },
  {
    label: "Disclaimer",
    path: "/disclaimer",
  },
  {
    label: "RSS Feed Page",
    path: "/feed",
  },
  {
    label: "HTML Sitemap",
    path: "/sitemap-page",
  },
] as const;
export function DesignCodeWorkspace({ initialStore }: DesignCodeWorkspaceProps) {
  const [store, setStore] = useState(initialStore);
  const [name, setName] = useState(initialStore.draftName);
  const [code, setCode] = useState(initialStore.draftCode);
  const [previewCode, setPreviewCode] = useState(initialStore.activeRevision.code);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewPath, setPreviewPath] = useState("/");
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [validation, setValidation] = useState<DesignCodeValidationResult | null>(null);
  const [loadingAction, setLoadingAction] = useState<DesignAction | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function runAction(action: DesignAction, revisionId?: string) {
    setLoadingAction(action);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/design-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          name,
          code,
          revisionId,
        }),
      });
      const payload = (await response.json()) as DesignCodeApiResponse;
      if (payload.validation) {
        setValidation(payload.validation);
        if (payload.validation.valid) {
          setPreviewCode(code);
        }
      }
      if (!response.ok) {
        throw new Error(payload.message || "Design Studio operation failed.");
      }
      if (payload.store) {
        setStore(payload.store);
        setName(payload.store.draftName);
        setCode(payload.store.draftCode);
        if (
          action === "activate" ||
          action === "rollback" ||
          action === "restore" ||
          action === "reset"
        ) {
          setPreviewCode(payload.store.activeRevision.code);
        }
      }
      setMessage(payload.message || "Operation completed successfully.");
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : "Design Studio operation failed.",
      );
    } finally {
      setLoadingAction(null);
    }
  }
  const applyPreviewCode = useCallback(
    (previewCss?: string) => {
      const iframe = previewFrameRef.current;
      if (!iframe) {
        return;
      }
      try {
        const previewDocument = iframe.contentDocument;
        if (!previewDocument?.head) {
          return;
        }
        const existingStyle = previewDocument.getElementById(
          "knowledge-nest-design-studio-preview",
        );
        if (existingStyle) {
          existingStyle.remove();
        }
        const style = previewDocument.createElement("style");
        style.id = "knowledge-nest-design-studio-preview";
        style.textContent = previewCss ?? previewCode;
        previewDocument.head.appendChild(style);
      } catch {
        setError("Unable to apply Design Studio CSS inside the website preview.");
      }
    },
    [previewCode],
  );
  async function previewDraft() {
    setLoadingAction("validate");
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/design-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "validate",
          name,
          code,
        }),
      });
      const payload = (await response.json()) as DesignCodeApiResponse;
      if (payload.validation) {
        setValidation(payload.validation);
      }
      if (!response.ok || !payload.validation?.valid) {
        throw new Error(payload.message || "Design code validation failed.");
      }
      setPreviewCode(code);
      applyPreviewCode(code);
      setMessage("Preview updated. The design is not active on the public website.");
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : "Unable to preview this design.",
      );
    } finally {
      setLoadingAction(null);
    }
  }
  function updateThemeVariable(variableName: string, value: string) {
    setCode((currentCode) => writeCssVariable(currentCode, variableName, value));
    setValidation(null);
    setMessage("");
    setError("");
  }
  function applyThemePreset(preset: ThemePreset) {
    setCode((currentCode) => applyThemeVariables(currentCode, preset.variables));
    setValidation(null);
    setMessage(
      `${preset.name} loaded into the draft. Preview it before applying to the public website.`,
    );
    setError("");
  }
  function previewCurrentDraft() {
    void previewDraft();
  }
  return (
    <div className="space-y-6">
      <section className="border-border rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          <h1 className="text-2xl font-black">Design Studio</h1>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          CSS design ko save, validate, preview, activate, restore aur reset karein.
        </p>
      </section>
      {message ? (
        <div className="border-border flex gap-3 rounded-xl border p-4 text-sm">
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border-destructive/40 text-destructive flex gap-3 rounded-xl border p-4 text-sm">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border-border rounded-2xl border p-6">
          <label className="block text-sm font-bold">
            Design name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              className="border-border mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <section className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black">Visual Theme Controls</h2>
                <p className="text-muted-foreground mt-1 max-w-2xl text-xs leading-5">
                  Build the main theme visually. Changes update the CSS draft only.
                  Nothing becomes public until you use Apply Design.
                </p>
              </div>
              <button
                type="button"
                onClick={previewCurrentDraft}
                disabled={loadingAction !== null}
                className="border-border inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-bold"
              >
                <Eye className="h-4 w-4" />
                Preview Draft
              </button>
            </div>
            <div className="mt-5">
              <p className="text-xs font-black tracking-[0.14em] uppercase">
                Theme presets
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {themePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyThemePreset(preset)}
                    disabled={loadingAction !== null}
                    className="border-border bg-background rounded-xl border p-4 text-left transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <span className="block text-sm font-black">{preset.name}</span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-5">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs font-black tracking-[0.14em] uppercase">Colours</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {colourControls.map((control) => {
                  const value = readCssVariable(code, control.variable, control.fallback);
                  return (
                    <label
                      key={control.variable}
                      className="border-border bg-background rounded-xl border p-3 text-xs font-bold"
                    >
                      {control.label}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={/^#[0-9a-f]{6}$/i.test(value) ? value : control.fallback}
                          onChange={(event) =>
                            updateThemeVariable(control.variable, event.target.value)
                          }
                          className="h-10 w-12 cursor-pointer rounded-lg border p-1"
                          aria-label={`${control.label} colour`}
                        />
                        <input
                          value={value}
                          onChange={(event) =>
                            updateThemeVariable(control.variable, event.target.value)
                          }
                          className="border-border h-10 min-w-0 flex-1 rounded-lg border px-3 font-mono text-xs"
                          aria-label={`${control.label} CSS value`}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold">
                Heading font
                <select
                  value={readCssVariable(
                    code,
                    "--knowledge-nest-design-heading-font",
                    "Arial, Helvetica, sans-serif",
                  )}
                  onChange={(event) =>
                    updateThemeVariable(
                      "--knowledge-nest-design-heading-font",
                      event.target.value,
                    )
                  }
                  className="border-border bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                >
                  {fontOptions.map((font) => (
                    <option key={font.label} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Body font
                <select
                  value={readCssVariable(
                    code,
                    "--knowledge-nest-design-body-font",
                    "Arial, Helvetica, sans-serif",
                  )}
                  onChange={(event) =>
                    updateThemeVariable(
                      "--knowledge-nest-design-body-font",
                      event.target.value,
                    )
                  }
                  className="border-border bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                >
                  {fontOptions.map((font) => (
                    <option key={font.label} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block text-xs font-bold">
              Corner style
              <select
                value={readCssVariable(code, "--knowledge-nest-design-radius", "1rem")}
                onChange={(event) =>
                  updateThemeVariable(
                    "--knowledge-nest-design-radius",
                    event.target.value,
                  )
                }
                className="border-border bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
              >
                {radiusOptions.map((radius) => (
                  <option key={radius.value} value={radius.value}>
                    {radius.label} — {radius.value}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="border-border bg-background rounded-xl border p-4">
                <p className="text-xs font-black uppercase">Active design</p>
                <p className="mt-2 truncate text-sm font-bold">
                  {store.activeRevision.name}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  This is currently published to the website.
                </p>
              </div>
              <div className="border-border bg-background rounded-xl border p-4">
                <p className="text-xs font-black uppercase">Current draft</p>
                <p className="mt-2 truncate text-sm font-bold">
                  {name || "Untitled Design"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Preview and validate before using Apply Design.
                </p>
              </div>
            </div>
          </section>
          <label className="mt-5 block text-sm font-bold">
            CSS design code
            <textarea
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setValidation(null);
              }}
              maxLength={100000}
              spellCheck={false}
              className="mt-2 min-h-[500px] w-full rounded-xl border bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100"
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void previewDraft()}
              disabled={loadingAction !== null}
              className="border-border inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            >
              <Eye className="h-4 w-4" />
              Preview Design
            </button>
            <button
              type="button"
              onClick={() => void runAction("save")}
              disabled={loadingAction !== null}
              className="border-border inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => void runAction("validate")}
              disabled={loadingAction !== null}
              className="border-border inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            >
              <ShieldCheck className="h-4 w-4" />
              Validate Code
            </button>
            <button
              type="button"
              onClick={() => void runAction("activate")}
              disabled={loadingAction !== null}
              className="bg-foreground text-background inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold"
            >
              <Zap className="h-4 w-4" />
              Apply Design
            </button>
            <button
              type="button"
              onClick={() => void runAction("rollback")}
              disabled={loadingAction !== null}
              className="border-border inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            >
              <Undo2 className="h-4 w-4" />
              Restore Previous
            </button>
            <button
              type="button"
              onClick={() => void runAction("reset")}
              disabled={loadingAction !== null}
              className="border-border inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Default
            </button>
          </div>
          {loadingAction ? (
            <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Processing...
            </p>
          ) : null}
          {validation ? (
            <div className="border-border mt-5 rounded-xl border p-4 text-sm">
              <p className="font-bold">
                {validation.valid ? "Validation passed" : "Validation failed"}
              </p>
              {validation.errors.map((validationError) => (
                <p key={validationError} className="text-destructive mt-2">
                  {validationError}
                </p>
              ))}
            </div>
          ) : null}
        </section>
        <div className="space-y-6">
          <section className="border-border rounded-2xl border p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <div>
                <h2 className="font-black">Real Website Preview</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Preview the draft design across real public website pages without
                  activating or publishing it.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold">
                Preview page
                <select
                  value={previewPath}
                  onChange={(event) => setPreviewPath(event.target.value)}
                  className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm"
                >
                  {previewTargets.map((target) => (
                    <option key={target.path} value={target.path}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className="border-border inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("tablet")}
                className="border-border inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
              >
                <Tablet className="h-4 w-4" />
                Tablet
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className="border-border inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </button>
            </div>
            <div className="mt-4 overflow-auto rounded-xl bg-slate-100 p-3">
              <iframe
                ref={previewFrameRef}
                title="Knowledge Nest live design preview"
                src={previewPath}
                onLoad={() => applyPreviewCode()}
                style={{
                  width: previewWidths[previewDevice],
                  maxWidth: "100%",
                }}
                className="mx-auto h-[700px] rounded-xl border bg-white"
              />
            </div>
          </section>
          <section className="border-border rounded-2xl border p-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <h2 className="font-black">Design History</h2>
            </div>
            <div className="mt-4 space-y-3">
              {store.history.map((revision) => {
                const isActive = revision.id === store.activeRevision.id;
                return (
                  <div
                    key={revision.id}
                    className="border-border flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{revision.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(revision.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {isActive ? (
                      <span className="bg-muted rounded-full px-2 py-1 text-xs font-bold">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void runAction("restore", revision.id)}
                        disabled={loadingAction !== null}
                        className="border-border rounded-lg border px-3 py-2 text-xs font-bold"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
