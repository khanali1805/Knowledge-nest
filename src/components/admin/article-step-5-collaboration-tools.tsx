"use client";
import {
  GitCompareArrows,
  History,
  LoaderCircle,
  Lock,
  LockOpen,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
type RevisionSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  status: string;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  tags: string;
  featuredImageId: string;
  readingTimeMinutes?: number;
};
type ServerRevision = {
  id: string;
  revisionNumber: number;
  title: string;
  reason: string;
  createdAt: string;
  snapshot: RevisionSnapshot;
};
type EditLock = {
  articleId: string;
  ownerUsername: string;
  lockToken: string;
  acquiredAt: string;
  heartbeatAt: string;
  expiresAt: string;
};
type LockResponse = {
  success?: boolean;
  acquired?: boolean;
  ownedByCurrentUser?: boolean;
  lock?: EditLock | null;
  message?: string;
};
type RevisionResponse = {
  success?: boolean;
  revisions?: ServerRevision[];
  message?: string;
};
type ArticleStep5CollaborationToolsProps = {
  articleId?: string;
  onLockChange: (lockedByAnotherUser: boolean) => void;
};
type ComparisonField = {
  label: string;
  first: string;
  second: string;
  changed: boolean;
};
const HEARTBEAT_INTERVAL_MS = 30_000;
function stripHtml(value: string): string {
  if (typeof window === "undefined") {
    return value.replace(/<[^>]*>/g, " ");
  }
  const container = window.document.createElement("div");
  container.innerHTML = value;
  return container.textContent ?? container.innerText ?? "";
}
function createFieldSummary(
  first: RevisionSnapshot,
  second: RevisionSnapshot,
): ComparisonField[] {
  const fields = [
    {
      label: "Title",
      first: first.title,
      second: second.title,
    },
    {
      label: "Slug",
      first: first.slug,
      second: second.slug,
    },
    {
      label: "Status",
      first: first.status,
      second: second.status,
    },
    {
      label: "Excerpt",
      first: first.excerpt,
      second: second.excerpt,
    },
    {
      label: "SEO Title",
      first: first.seoTitle,
      second: second.seoTitle,
    },
    {
      label: "SEO Description",
      first: first.seoDescription,
      second: second.seoDescription,
    },
    {
      label: "Focus Keyword",
      first: first.focusKeyword,
      second: second.focusKeyword,
    },
    {
      label: "Tags",
      first: first.tags,
      second: second.tags,
    },
  ];
  return fields.map((field) => ({
    ...field,
    changed: field.first !== field.second,
  }));
}
async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
export function ArticleStep5CollaborationTools({
  articleId,
  onLockChange,
}: ArticleStep5CollaborationToolsProps) {
  const [lock, setLock] = useState<EditLock | null>(null);
  const [lockToken, setLockToken] = useState("");
  const [lockMessage, setLockMessage] = useState("");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [revisions, setRevisions] = useState<ServerRevision[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [firstRevisionId, setFirstRevisionId] = useState("");
  const [secondRevisionId, setSecondRevisionId] = useState("");
  const ownsLock = Boolean(lock && lockToken && lock.lockToken === lockToken);
  const firstRevision = useMemo(
    () => revisions.find((revision) => revision.id === firstRevisionId) ?? null,
    [firstRevisionId, revisions],
  );
  const secondRevision = useMemo(
    () => revisions.find((revision) => revision.id === secondRevisionId) ?? null,
    [revisions, secondRevisionId],
  );
  const fieldSummary = useMemo(() => {
    if (!firstRevision || !secondRevision) {
      return [];
    }
    return createFieldSummary(firstRevision.snapshot, secondRevision.snapshot);
  }, [firstRevision, secondRevision]);
  const acquireLock = useCallback(async () => {
    if (!articleId) {
      setLock(null);
      setLockToken("");
      setLockMessage("");
      setError("");
      onLockChange(false);
      return;
    }
    setIsWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await readJsonResponse<LockResponse>(response);
      if (response.status === 409 && result.lock) {
        setLock(result.lock);
        setLockToken("");
        setLockMessage(
          result.message ?? "Article kisi aur session mein edit ho raha hai.",
        );
        onLockChange(true);
        return;
      }
      if (!response.ok || !result.acquired || !result.lock) {
        setLock(null);
        setLockToken("");
        setLockMessage(
          "Server lock verify nahi hua. Editor local changes ke liye available hai.",
        );
        onLockChange(false);
        setError("");
        return;
      }
      setLock(result.lock);
      setLockToken(result.lock.lockToken);
      setLockMessage("Exclusive server draft lock active hai.");
      onLockChange(false);
    } catch {
      setLock(null);
      setLockToken("");
      setLockMessage(
        "Server lock temporarily unavailable hai. Editor local changes ke liye available hai.",
      );
      onLockChange(false);
      setError("");
    } finally {
      setIsWorking(false);
    }
  }, [articleId, onLockChange]);
  const heartbeatLock = useCallback(async () => {
    if (!articleId || !lockToken) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lockToken,
        }),
      });
      const result = await readJsonResponse<LockResponse>(response);
      if (response.status === 409 && result.lock) {
        setLock(result.lock);
        setLockToken("");
        setLockMessage(
          result.message ?? "Article edit lock kisi aur session ke paas hai.",
        );
        onLockChange(true);
        return;
      }
      if (!response.ok || !result.lock) {
        setLock(null);
        setLockToken("");
        setLockMessage(result.message ?? "Server lock heartbeat verify nahi hua.");
        onLockChange(false);
        return;
      }
      setLock(result.lock);
      setLockMessage("Exclusive server draft lock active hai.");
      setError("");
      onLockChange(false);
    } catch {
      setLock(null);
      setLockToken("");
      setLockMessage(
        "Server lock heartbeat temporarily unavailable hai. Editor local changes ke liye available hai.",
      );
      setError("");
      onLockChange(false);
    }
  }, [articleId, lockToken, onLockChange]);
  const loadRevisions = useCallback(async () => {
    if (!articleId) {
      setError("Revision comparison ke liye pehle article save karein.");
      return;
    }
    setIsWorking(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/revisions?limit=50`,
        {
          cache: "no-store",
        },
      );
      const result = await readJsonResponse<RevisionResponse>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Revision comparison data load nahi hua.");
      }
      const loadedRevisions = result.revisions ?? [];
      setRevisions(loadedRevisions);
      setFirstRevisionId(loadedRevisions[0]?.id ?? "");
      setSecondRevisionId(loadedRevisions[1]?.id ?? loadedRevisions[0]?.id ?? "");
      setIsCompareOpen(true);
    } catch (revisionError) {
      setError(
        revisionError instanceof Error
          ? revisionError.message
          : "Revision comparison data load nahi hua.",
      );
    } finally {
      setIsWorking(false);
    }
  }, [articleId]);
  useEffect(() => {
    if (!articleId) {
      return;
    }
    const startTimer = window.setTimeout(() => {
      void acquireLock();
    }, 0);
    return () => {
      window.clearTimeout(startTimer);
    };
  }, [acquireLock, articleId]);
  useEffect(() => {
    if (!articleId || !lockToken) {
      return;
    }
    const heartbeatTimer = window.setInterval(() => {
      void heartbeatLock();
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      window.clearInterval(heartbeatTimer);
    };
  }, [articleId, heartbeatLock, lockToken]);
  useEffect(() => {
    if (!articleId || !lockToken) {
      return;
    }
    const releaseUrl = `/api/admin/articles/${articleId}/lock`;
    const releasePayload = JSON.stringify({
      lockToken,
    });
    function releaseOnUnload() {
      void fetch(releaseUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: releasePayload,
        keepalive: true,
      });
    }
    window.addEventListener("beforeunload", releaseOnUnload);
    return () => {
      window.removeEventListener("beforeunload", releaseOnUnload);
      void fetch(releaseUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: releasePayload,
        keepalive: true,
      });
    };
  }, [articleId, lockToken]);
  if (!articleId) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Article ko pehle draft save karein. Step 5 server locking aur revision comparison
        us ke baad active hoga.
      </section>
    );
  }
  return (
    <>
      <section className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {ownsLock ? (
                <Lock className="h-4 w-4 text-emerald-700" />
              ) : (
                <LockOpen className="h-4 w-4 text-amber-700" />
              )}
              <h2 className="text-sm font-bold text-slate-950">
                Step 5 Conflict Protection
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {lockMessage || "Server draft lock status load ho raha hai."}
            </p>
            {lock ? (
              <p className="mt-1 text-xs text-slate-500">
                Lock owner: {lock.ownerUsername}
                {" · "}
                Expiry: {new Date(lock.expiresAt).toLocaleTimeString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => void acquireLock()}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isWorking ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Lock
            </button>
            <button
              type="button"
              disabled={isWorking}
              onClick={() => void loadRevisions()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GitCompareArrows className="h-4 w-4" />
              Compare Revisions
            </button>
          </div>
        </div>
        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
      </section>
      {isCompareOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Revision comparison"
            className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <h2 className="font-bold text-slate-950">Server Revision Comparison</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                aria-label="Close comparison"
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 border-b border-slate-200 p-4 md:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">
                First revision
                <select
                  value={firstRevisionId}
                  onChange={(event) => setFirstRevisionId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {revisions.map((revision) => (
                    <option key={revision.id} value={revision.id}>
                      Revision #{revision.revisionNumber}
                      {" · "}
                      {revision.reason}
                      {" · "}
                      {new Date(revision.createdAt).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Second revision
                <select
                  value={secondRevisionId}
                  onChange={(event) => setSecondRevisionId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {revisions.map((revision) => (
                    <option key={revision.id} value={revision.id}>
                      Revision #{revision.revisionNumber}
                      {" · "}
                      {revision.reason}
                      {" · "}
                      {new Date(revision.createdAt).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!firstRevision || !secondRevision ? (
                <div className="flex min-h-52 items-center justify-center text-sm text-slate-500">
                  Comparison ke liye kam az kam do revisions required hain.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3">Field</th>
                          <th className="px-4 py-3">
                            Revision #{firstRevision.revisionNumber}
                          </th>
                          <th className="px-4 py-3">
                            Revision #{secondRevision.revisionNumber}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fieldSummary.map((field) => (
                          <tr
                            key={field.label}
                            className={field.changed ? "bg-amber-50" : ""}
                          >
                            <th className="border-t border-slate-200 px-4 py-3 align-top">
                              {field.label}
                            </th>
                            <td className="border-t border-slate-200 px-4 py-3 align-top">
                              {field.first || "—"}
                            </td>
                            <td className="border-t border-slate-200 px-4 py-3 align-top">
                              {field.second || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border border-slate-200">
                      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                        Revision #{firstRevision.revisionNumber}
                        {" Content"}
                      </header>
                      <pre className="max-h-[48vh] overflow-y-auto p-4 text-sm leading-7 whitespace-pre-wrap">
                        {stripHtml(firstRevision.snapshot.content)}
                      </pre>
                    </section>
                    <section className="rounded-xl border border-slate-200">
                      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                        Revision #{secondRevision.revisionNumber}
                        {" Content"}
                      </header>
                      <pre className="max-h-[48vh] overflow-y-auto p-4 text-sm leading-7 whitespace-pre-wrap">
                        {stripHtml(secondRevision.snapshot.content)}
                      </pre>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
