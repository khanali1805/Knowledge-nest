"use client";
import { Activity, Clock3, LoaderCircle, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type ArticleStep3Snapshot } from "@/components/admin/article-step-3-tools";
type ActivityRecord = {
  id: string;
  articleId: string;
  username: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};
type PresenceRecord = {
  articleId: string;
  sessionId: string;
  username: string;
  joinedAt: string;
  lastSeenAt: string;
  expiresAt: string;
};
type ActivityResponse = {
  success?: boolean;
  activities?: ActivityRecord[];
  message?: string;
};
type PresenceResponse = {
  success?: boolean;
  editors?: PresenceRecord[];
  message?: string;
};
type ArticleStep6ActivityToolsProps = {
  articleId?: string;
  snapshot: ArticleStep3Snapshot;
};
const PRESENCE_HEARTBEAT_MS = 20_000;
const ACTIVITY_REFRESH_MS = 15_000;
const CHANGE_AUDIT_DELAY_MS = 12_000;
async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return [
    Date.now().toString(16),
    Math.random().toString(16).slice(2),
    "4fff",
    "8fff",
    Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12),
  ].join("-");
}
function getActivityLabel(action: string): string {
  const labels: Record<string, string> = {
    editor_joined: "Editor Joined",
    editor_left: "Editor Left",
    content_changed: "Content Changed",
    manual_refresh: "Activity Refreshed",
  };
  return (
    labels[action] ??
    action.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())
  );
}
export function ArticleStep6ActivityTools({
  articleId,
  snapshot,
}: ArticleStep6ActivityToolsProps) {
  const [sessionId] = useState(createSessionId);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [editors, setEditors] = useState<PresenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const snapshotFingerprint = useMemo(
    () =>
      JSON.stringify({
        title: snapshot.title,
        slug: snapshot.slug,
        excerpt: snapshot.excerpt,
        content: snapshot.content,
        categoryId: snapshot.categoryId,
        status: snapshot.status,
        isFeatured: snapshot.isFeatured,
        seoTitle: snapshot.seoTitle,
        seoDescription: snapshot.seoDescription,
        focusKeyword: snapshot.focusKeyword,
        tags: snapshot.tags,
        featuredImageId: snapshot.featuredImageId,
      }),
    [snapshot],
  );
  const [lastAuditedFingerprint, setLastAuditedFingerprint] =
    useState(snapshotFingerprint);
  const loadActivity = useCallback(async () => {
    if (!articleId) {
      return;
    }
    try {
      const [activityResponse, presenceResponse] = await Promise.all([
        fetch(`/api/admin/articles/${articleId}/activity?limit=50`, {
          cache: "no-store",
        }),
        fetch(`/api/admin/articles/${articleId}/presence`, {
          cache: "no-store",
        }),
      ]);
      const activityResult = await readJsonResponse<ActivityResponse>(activityResponse);
      const presenceResult = await readJsonResponse<PresenceResponse>(presenceResponse);
      if (!activityResponse.ok) {
        throw new Error(activityResult.message ?? "Activity log load nahi hua.");
      }
      if (!presenceResponse.ok) {
        throw new Error(presenceResult.message ?? "Editor presence load nahi hui.");
      }
      setActivities(activityResult.activities ?? []);
      setEditors(presenceResult.editors ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Step 6 data load nahi hua.",
      );
    }
  }, [articleId]);
  const sendPresence = useCallback(
    async (event: "join" | "heartbeat") => {
      if (!articleId) {
        return;
      }
      const response = await fetch(`/api/admin/articles/${articleId}/presence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          event,
        }),
      });
      const result = await readJsonResponse<PresenceResponse>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Editor presence update nahi hui.");
      }
      setEditors(result.editors ?? []);
    },
    [articleId, sessionId],
  );
  const createChangeAudit = useCallback(async () => {
    if (!articleId) {
      return;
    }
    const response = await fetch(`/api/admin/articles/${articleId}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "content_changed",
        summary: "Article editor mein content ya metadata change hui.",
        metadata: {
          status: snapshot.status,
          contentLength: snapshot.content.length,
          source: "editor_change_audit",
        },
      }),
    });
    const result = await readJsonResponse<ActivityResponse>(response);
    if (!response.ok) {
      throw new Error(result.message ?? "Change audit save nahi hua.");
    }
    await loadActivity();
  }, [articleId, loadActivity, snapshot.content.length, snapshot.status]);
  useEffect(() => {
    if (!articleId) {
      return;
    }
    const timer = window.setTimeout(() => {
      void sendPresence("join")
        .then(loadActivity)
        .catch((presenceError) => {
          setError(
            presenceError instanceof Error
              ? presenceError.message
              : "Editor presence start nahi hui.",
          );
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [articleId, loadActivity, sendPresence]);
  useEffect(() => {
    if (!articleId) {
      return;
    }
    const heartbeatTimer = window.setInterval(() => {
      void sendPresence("heartbeat").catch((presenceError) => {
        setError(
          presenceError instanceof Error
            ? presenceError.message
            : "Presence heartbeat fail hui.",
        );
      });
    }, PRESENCE_HEARTBEAT_MS);
    return () => {
      window.clearInterval(heartbeatTimer);
    };
  }, [articleId, sendPresence]);
  useEffect(() => {
    if (!articleId) {
      return;
    }
    const refreshTimer = window.setInterval(() => {
      void loadActivity();
    }, ACTIVITY_REFRESH_MS);
    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [articleId, loadActivity]);
  useEffect(() => {
    if (!articleId || snapshotFingerprint === lastAuditedFingerprint) {
      return;
    }
    const auditTimer = window.setTimeout(() => {
      void createChangeAudit()
        .then(() => {
          setLastAuditedFingerprint(snapshotFingerprint);
        })
        .catch((auditError) => {
          setError(
            auditError instanceof Error
              ? auditError.message
              : "Change audit save nahi hua.",
          );
        });
    }, CHANGE_AUDIT_DELAY_MS);
    return () => {
      window.clearTimeout(auditTimer);
    };
  }, [articleId, createChangeAudit, lastAuditedFingerprint, snapshotFingerprint]);
  useEffect(() => {
    if (!articleId) {
      return;
    }
    const presenceUrl = `/api/admin/articles/${articleId}/presence`;
    const payload = JSON.stringify({
      sessionId,
    });
    function releasePresence() {
      void fetch(presenceUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      });
    }
    window.addEventListener("beforeunload", releasePresence);
    return () => {
      window.removeEventListener("beforeunload", releasePresence);
      releasePresence();
    };
  }, [articleId, sessionId]);
  if (!articleId) {
    return (
      <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">
        Step 6 activity log aur editor presence article draft save hone ke baad active
        hogi.
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-950">
              Step 6 Collaboration Activity
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {editors.length} active editor sessions
            </span>
            <span>{activities.length} recent activities</span>
            <span>Presence heartbeat har 20 seconds</span>
          </div>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setIsLoading(true);
            void loadActivity().finally(() => {
              setIsLoading(false);
            });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800 disabled:opacity-50"
        >
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Activity
        </button>
      </div>
      {editors.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {editors.map((editor) => (
            <span
              key={`${editor.sessionId}-${editor.username}`}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-900"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {editor.username}
            </span>
          ))}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-cyan-200 bg-white p-5 text-center text-xs text-slate-500">
            Abhi koi collaborative activity available nahi hai.
          </div>
        ) : (
          activities.map((activity) => (
            <article
              key={activity.id}
              className="rounded-lg border border-cyan-100 bg-white p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {getActivityLabel(activity.action)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{activity.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{activity.username}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                  <Clock3 className="h-3 w-3" />
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
