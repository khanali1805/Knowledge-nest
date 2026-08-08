"use client";
import {
  Cloud,
  CloudUpload,
  History,
  LoaderCircle,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ArticleStep3Snapshot } from "@/components/admin/article-step-3-tools";
const SERVER_AUTOSAVE_INTERVAL_MS = 30_000;
type ServerRevision = {
  id: string;
  articleId: string;
  revisionNumber: number;
  title: string;
  reason: string;
  changeSummary?: string | null;
  createdAt: string;
  snapshot: ArticleStep3Snapshot & {
    readingTimeMinutes?: number;
  };
};
type RevisionListResponse = {
  success?: boolean;
  revisions?: ServerRevision[];
  message?: string;
};
type RevisionSaveResponse = {
  success?: boolean;
  revision?: ServerRevision;
  message?: string;
};
type RevisionRestoreResponse = {
  success?: boolean;
  snapshot?: ArticleStep3Snapshot;
  message?: string;
};
async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {} as T;
  }
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
type ArticleStep4ServerToolsProps = {
  articleId?: string;
  snapshot: ArticleStep3Snapshot;
  readingTimeMinutes: number;
  onRestore: (snapshot: ArticleStep3Snapshot) => void;
};
export function ArticleStep4ServerTools({
  articleId,
  snapshot,
  readingTimeMinutes,
  onRestore,
}: ArticleStep4ServerToolsProps) {
  const [revisions, setRevisions] = useState<ServerRevision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastServerSaveAt, setLastServerSaveAt] = useState("");
  const serialisedSnapshot = JSON.stringify({
    ...snapshot,
    readingTimeMinutes,
  });
  const lastSavedSnapshotRef = useRef(serialisedSnapshot);
  const loadRevisions = useCallback(async () => {
    if (!articleId) {
      setRevisions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/revisions?limit=50`,
        {
          cache: "no-store",
        },
      );
      const result = await readJsonResponse<RevisionListResponse>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Server revisions load nahi huin.");
      }
      setRevisions(result.revisions ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Server revisions load nahi huin.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);
  const saveServerRevision = useCallback(
    async (reason: "autosave" | "manual" | "publish", showMessage: boolean) => {
      if (!articleId) {
        if (showMessage) {
          setError(
            "Pehle article ko draft ke tor par save karein. Us ke baad server autosave active hoga.",
          );
        }
        return;
      }
      if (reason === "autosave" && serialisedSnapshot === lastSavedSnapshotRef.current) {
        return;
      }
      setIsSaving(true);
      if (showMessage) {
        setMessage("");
        setError("");
      }
      try {
        const response = await fetch(`/api/admin/articles/${articleId}/revisions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
            changeSummary:
              reason === "autosave"
                ? "Automatic server autosave"
                : "Manual server revision",
            snapshot: {
              ...snapshot,
              readingTimeMinutes,
            },
          }),
        });
        const result = await readJsonResponse<RevisionSaveResponse>(response);
        if (!response.ok || !result.revision) {
          throw new Error(result.message ?? "Server revision save nahi hui.");
        }
        lastSavedSnapshotRef.current = serialisedSnapshot;
        setLastServerSaveAt(result.revision.createdAt);
        setRevisions((currentRevisions) =>
          [
            result.revision as ServerRevision,
            ...currentRevisions.filter((revision) => revision.id !== result.revision?.id),
          ].slice(0, 50),
        );
        if (showMessage) {
          setMessage(result.message ?? "Server revision save ho gayi.");
        }
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Server revision save nahi hui.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [articleId, readingTimeMinutes, serialisedSnapshot, snapshot],
  );
  useEffect(() => {
    if (!articleId) {
      return;
    }
    const timer = window.setTimeout(() => {
      void loadRevisions();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [articleId, loadRevisions]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void saveServerRevision("autosave", false);
    }, SERVER_AUTOSAVE_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [saveServerRevision]);
  async function restoreRevision(revision: ServerRevision) {
    if (!articleId) {
      return;
    }
    const confirmed = window.confirm(
      `Revision #${revision.revisionNumber} restore karni hai? Current database version ki safety backup pehle create hogi.`,
    );
    if (!confirmed) {
      return;
    }
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/revisions/${revision.id}`,
        {
          method: "POST",
        },
      );
      const result = await readJsonResponse<RevisionRestoreResponse>(response);
      if (!response.ok || !result.snapshot) {
        throw new Error(result.message ?? "Server revision restore nahi hui.");
      }
      onRestore(result.snapshot);
      lastSavedSnapshotRef.current = JSON.stringify({
        ...result.snapshot,
        readingTimeMinutes: revision.snapshot.readingTimeMinutes ?? readingTimeMinutes,
      });
      setMessage(result.message ?? "Server revision restore ho gayi.");
      setIsHistoryOpen(false);
      await loadRevisions();
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Server revision restore nahi hui.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  async function deleteRevision(revision: ServerRevision) {
    if (!articleId) {
      return;
    }
    const confirmed = window.confirm(
      `Revision #${revision.revisionNumber} permanently delete karni hai?`,
    );
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/revisions/${revision.id}`,
        {
          method: "DELETE",
        },
      );
      const result = await readJsonResponse<{
        success?: boolean;
        message?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Revision delete nahi hui.");
      }
      setRevisions((currentRevisions) =>
        currentRevisions.filter((currentRevision) => currentRevision.id !== revision.id),
      );
      setMessage(result.message ?? "Server revision delete ho gayi.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Server revision delete nahi hui.",
      );
    }
  }
  return (
    <>
      <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-950">
                Step 4 Server Protection
              </h2>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
              <span>Server autosave har 30 seconds</span>
              <span>
                {articleId
                  ? "Database protection active"
                  : "Draft save ke baad active hoga"}
              </span>
              <span>{revisions.length} server revisions</span>
              {lastServerSaveAt ? (
                <span>
                  Last server save {new Date(lastServerSaveAt).toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSaving || !articleId}
              onClick={() => void saveServerRevision("manual", true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              Save to Server
            </button>
            <button
              type="button"
              disabled={!articleId}
              onClick={() => {
                setIsHistoryOpen(true);
                void loadRevisions();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <History className="h-4 w-4" />
              Server History
            </button>
          </div>
        </div>
        {message ? (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
      </section>
      {isHistoryOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Server revision history"
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-950">Server Revision History</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Database mein maximum 50 revisions retain hoti hain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Close server history"
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {isLoading ? (
                <div className="flex min-h-52 items-center justify-center">
                  <LoaderCircle className="h-7 w-7 animate-spin" />
                </div>
              ) : revisions.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center text-slate-500">
                  <Cloud className="h-10 w-10" />
                  <p className="mt-3 text-sm">Koi server revision available nahi hai.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {revisions.map((revision) => (
                    <article
                      key={revision.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            Revision #{revision.revisionNumber}
                            {" · "}
                            {revision.title || "Untitled Article"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(revision.createdAt).toLocaleString()}
                            {" · "}
                            {revision.reason}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void restoreRevision(revision)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void deleteRevision(revision)}
                            aria-label="Delete server revision"
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
