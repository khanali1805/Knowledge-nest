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
