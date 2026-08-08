"use client";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Clock3,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
type RecentActivity = {
  id: string;
  articleId: string;
  username: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  articleTitle: string | null;
  articleSlug: string | null;
};
type ActivePresence = {
  articleId: string;
  sessionId: string;
  username: string;
  joinedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  articleTitle: string | null;
  articleSlug: string | null;
};
type TopArticle = {
  articleId: string;
  title: string;
  slug: string;
  activityCount: number;
  lastActivityAt: string;
};
type GlobalDashboard = {
  totalActivities: number;
  totalActiveEditors: number;
  activeArticles: number;
  uniqueEditors: number;
  recentActivities: RecentActivity[];
  activePresence: ActivePresence[];
  topArticles: TopArticle[];
};
type DashboardResponse = {
  success?: boolean;
  dashboard?: GlobalDashboard;
  message?: string;
};
async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
function formatActionLabel(action: string): string {
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
export default function AdminCollaborationPage() {
  const [dashboard, setDashboard] = useState<GlobalDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/collaboration/dashboard", {
        cache: "no-store",
      });
      const result = await readJsonResponse<DashboardResponse>(response);
      if (!response.ok || !result.dashboard) {
        throw new Error(result.message ?? "Collaboration dashboard load nahi hua.");
      }
      setDashboard(result.dashboard);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Collaboration dashboard load nahi hua.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDashboard]);
  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadDashboard();
    }, 30_000);
    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadDashboard]);
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-700" />
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Collaboration Dashboard
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Active editors, audit activity aur collaborative article performance.
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void loadDashboard()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Dashboard
          </button>
        </header>
        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Activity className="h-4 w-4" />
              Total Activities
            </div>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {dashboard?.totalActivities ?? 0}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Users className="h-4 w-4" />
              Active Editors
            </div>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {dashboard?.totalActiveEditors ?? 0}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <FileText className="h-4 w-4" />
              Active Articles
            </div>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {dashboard?.activeArticles ?? 0}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Users className="h-4 w-4" />
              Unique Editors
            </div>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {dashboard?.uniqueEditors ?? 0}
            </p>
          </article>
        </section>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-950">Recent Collaborative Activity</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest 50 activities across all articles.
              </p>
            </header>
            <div className="max-h-[680px] divide-y divide-slate-100 overflow-y-auto">
              {(dashboard?.recentActivities ?? []).length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Abhi koi collaborative activity available nahi hai.
                </div>
              ) : (
                dashboard?.recentActivities.map((activity) => (
                  <article key={activity.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700">
                            {formatActionLabel(activity.action)}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {activity.username}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{activity.summary}</p>
                        {activity.articleTitle ? (
                          <Link
                            href={`/admin/articles/${activity.articleId}/edit`}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"
                          >
                            {activity.articleTitle}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </div>
                      <time className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(activity.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
          <div className="space-y-6">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-950">Active Editor Sessions</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Live presence sessions across articles.
                </p>
              </header>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {(dashboard?.activePresence ?? []).length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Abhi koi active editor session nahi hai.
                  </div>
                ) : (
                  dashboard?.activePresence.map((presence) => (
                    <article
                      key={`${presence.articleId}-${presence.sessionId}`}
                      className="p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">
                            {presence.username}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-600">
                            {presence.articleTitle ?? presence.articleId}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Last seen {new Date(presence.lastSeenAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-950">Top Collaborative Articles</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Articles with highest audit activity.
                </p>
              </header>
              <div className="divide-y divide-slate-100">
                {(dashboard?.topArticles ?? []).length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Article analytics available nahi hain.
                  </div>
                ) : (
                  dashboard?.topArticles.map((article) => (
                    <article key={article.articleId} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/articles/${article.articleId}/edit`}
                            className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-indigo-700"
                          >
                            {article.title}
                          </Link>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Last activity{" "}
                            {new Date(article.lastActivityAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                          {article.activityCount}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
