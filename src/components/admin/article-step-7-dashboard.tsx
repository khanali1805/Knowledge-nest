"use client";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
type DashboardAction = {
  action: string;
  count: number;
};
type DashboardEditor = {
  username: string;
  activityCount: number;
  lastActivityAt: string;
};
type DailyActivity = {
  date: string;
  count: number;
};
type ArticleDashboard = {
  articleId: string;
  totalActivities: number;
  totalActiveEditors: number;
  uniqueEditors: number;
  latestActivityAt: string | null;
  actions: DashboardAction[];
  editors: DashboardEditor[];
  dailyActivity: DailyActivity[];
  recentActivities: ActivityRecord[];
  activeEditors: PresenceRecord[];
};
type FilterOptions = {
  actions: string[];
  usernames: string[];
};
type FilterResponse = {
  success?: boolean;
  activities?: ActivityRecord[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  message?: string;
  options?: FilterOptions;
};
type DashboardResponse = {
  success?: boolean;
  dashboard?: ArticleDashboard;
  message?: string;
};
type ArticleStep7DashboardProps = {
  articleId?: string;
};
type ExportFormat = "csv" | "json";
const PAGE_SIZE = 20;
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
function getDownloadFilename(response: Response, fallbackFormat: ExportFormat): string {
  const disposition = response.headers.get("Content-Disposition");
  const filenameMatch = disposition?.match(/filename="([^"]+)"/i);
  return filenameMatch?.[1] ?? `article-activity-export.${fallbackFormat}`;
}
export function ArticleStep7Dashboard({ articleId }: ArticleStep7DashboardProps) {
  const [dashboard, setDashboard] = useState<ArticleDashboard | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    actions: [],
    usernames: [],
  });
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const totalPages = useMemo(() => Math.max(Math.ceil(total / PAGE_SIZE), 1), [total]);
  const filterPayload = useMemo(
    () => ({
      actions: selectedActions.length > 0 ? selectedActions : undefined,
      usernames: selectedUsernames.length > 0 ? selectedUsernames : undefined,
      search: search.trim() || undefined,
      dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE,
      sortDirection,
    }),
    [
      currentPage,
      dateFrom,
      dateTo,
      search,
      selectedActions,
      selectedUsernames,
      sortDirection,
    ],
  );
  const loadDashboard = useCallback(async () => {
    if (!articleId) {
      return;
    }
    const response = await fetch(`/api/admin/articles/${articleId}/activity/dashboard`, {
      cache: "no-store",
    });
    const result = await readJsonResponse<DashboardResponse>(response);
    if (!response.ok || !result.dashboard) {
      throw new Error(result.message ?? "Article collaboration dashboard load nahi hua.");
    }
    setDashboard(result.dashboard);
  }, [articleId]);
  const loadFilterOptions = useCallback(async () => {
    if (!articleId) {
      return;
    }
    const response = await fetch(`/api/admin/articles/${articleId}/activity/filter`, {
      cache: "no-store",
    });
    const result = await readJsonResponse<FilterResponse>(response);
    if (!response.ok) {
      throw new Error(result.message ?? "Activity filter options load nahi huin.");
    }
    setFilterOptions(
      result.options ?? {
        actions: [],
        usernames: [],
      },
    );
  }, [articleId]);
  const loadFilteredActivities = useCallback(async () => {
    if (!articleId) {
      return;
    }
    const response = await fetch(`/api/admin/articles/${articleId}/activity/filter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filterPayload),
    });
    const result = await readJsonResponse<FilterResponse>(response);
    if (!response.ok) {
      throw new Error(result.message ?? "Filtered activities load nahi huin.");
    }
    setActivities(result.activities ?? []);
    setTotal(result.total ?? 0);
    setHasMore(result.hasMore ?? false);
  }, [articleId, filterPayload]);
  const refreshAll = useCallback(async () => {
    if (!articleId) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await Promise.all([loadDashboard(), loadFilterOptions(), loadFilteredActivities()]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Step 7 dashboard load nahi hua.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [articleId, loadDashboard, loadFilterOptions, loadFilteredActivities]);
  useEffect(() => {
    if (!articleId || !isOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [articleId, isOpen, refreshAll]);
  useEffect(() => {
    if (!articleId || !isOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      void loadFilteredActivities().catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Filtered activities load nahi huin.",
        );
      });
    }, 250);
    return () => {
      window.clearTimeout(timer);
    };
  }, [articleId, isOpen, loadFilteredActivities]);
  function toggleAction(action: string) {
    setCurrentPage(1);
    setSelectedActions((currentActions) =>
      currentActions.includes(action)
        ? currentActions.filter((currentAction) => currentAction !== action)
        : [...currentActions, action],
    );
  }
  function toggleUsername(username: string) {
    setCurrentPage(1);
    setSelectedUsernames((currentUsernames) =>
      currentUsernames.includes(username)
        ? currentUsernames.filter((currentUsername) => currentUsername !== username)
        : [...currentUsernames, username],
    );
  }
  function clearFilters() {
    setSelectedActions([]);
    setSelectedUsernames([]);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSortDirection("desc");
    setCurrentPage(1);
  }
  async function exportAudit(format: ExportFormat) {
    if (!articleId) {
      return;
    }
    setIsExporting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/activity/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...filterPayload,
          format,
          limit: undefined,
          offset: undefined,
        }),
      });
      if (!response.ok) {
        const result = await readJsonResponse<{
          message?: string;
        }>(response);
        throw new Error(result.message ?? "Audit export create nahi hua.");
      }
      const fileBlob = await response.blob();
      const objectUrl = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getDownloadFilename(response, format);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Audit export create nahi hua.",
      );
    } finally {
      setIsExporting(false);
    }
  }
  if (!articleId) {
    return (
      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
        Step 7 activity filters, audit export aur dashboard article draft save hone ke
        baad active hoga.
      </section>
    );
  }
  return (
    <>
      <section className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-700" />
              <h2 className="text-sm font-bold text-slate-950">Step 7 Audit Dashboard</h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Activity filters, audit export aur collaboration analytics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800"
          >
            <Activity className="h-4 w-4" />
            Open Audit Dashboard
          </button>
        </div>
      </section>
      {isOpen ? (
        <div className="fixed inset-0 z-[160] bg-slate-950/80 p-3 sm:p-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-950">
                  Article Collaboration Dashboard
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Filter, review aur export complete audit history.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void refreshAll()}
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Refresh dashboard"
                >
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                  aria-label="Close dashboard"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
              {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Activity className="h-4 w-4" />
                    Total Activities
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {dashboard?.totalActivities ?? 0}
                  </p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Users className="h-4 w-4" />
                    Active Editors
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {dashboard?.totalActiveEditors ?? 0}
                  </p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Users className="h-4 w-4" />
                    Unique Editors
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {dashboard?.uniqueEditors ?? 0}
                  </p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    Latest Activity
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-950">
                    {dashboard?.latestActivityAt
                      ? new Date(dashboard.latestActivityAt).toLocaleString()
                      : "No activity"}
                  </p>
                </article>
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[320px_1fr]">
                <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <h3 className="text-sm font-bold">Activity Filters</h3>
                    </div>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-semibold text-indigo-700 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <label className="block text-xs font-bold text-slate-700">
                    Search
                    <div className="relative mt-2">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Summary, action ya editor"
                        className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm"
                      />
                    </div>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <label className="text-xs font-bold text-slate-700">
                      Date From
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(event) => {
                          setDateFrom(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      Date To
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(event) => {
                          setDateTo(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-700">
                    Sort Order
                    <select
                      value={sortDirection}
                      onChange={(event) => {
                        setSortDirection(event.target.value as "asc" | "desc");
                        setCurrentPage(1);
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </label>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Actions</p>
                    <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                      {filterOptions.actions.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Koi action option available nahi.
                        </p>
                      ) : (
                        filterOptions.actions.map((action) => (
                          <label
                            key={action}
                            className="flex items-center gap-2 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedActions.includes(action)}
                              onChange={() => toggleAction(action)}
                            />
                            {formatActionLabel(action)}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Editors</p>
                    <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                      {filterOptions.usernames.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Koi editor option available nahi.
                        </p>
                      ) : (
                        filterOptions.usernames.map((username) => (
                          <label
                            key={username}
                            className="flex items-center gap-2 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsernames.includes(username)}
                              onChange={() => toggleUsername(username)}
                            />
                            {username}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold text-slate-700">Audit Export</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={() => void exportAudit("csv")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV
                      </button>
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={() => void exportAudit("json")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 disabled:opacity-50"
                      >
                        <FileJson className="h-4 w-4" />
                        JSON
                      </button>
                    </div>
                    {isExporting ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        Export create ho raha hai.
                      </div>
                    ) : null}
                  </div>
                </aside>
                <main className="space-y-5">
                  <section className="rounded-xl border border-slate-200 bg-white">
                    <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          Filtered Activity Log
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {total} matching records
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                        <Download className="h-4 w-4" />
                        Current filters export par bhi apply honge.
                      </div>
                    </header>
                    <div className="divide-y divide-slate-100">
                      {activities.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                          Filter ke mutabiq koi activity nahi mili.
                        </div>
                      ) : (
                        activities.map((activity) => (
                          <article key={activity.id} className="p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700">
                                    {formatActionLabel(activity.action)}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700">
                                    {activity.username}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-700">
                                  {activity.summary}
                                </p>
                              </div>
                              <time className="shrink-0 text-xs text-slate-500">
                                {new Date(activity.createdAt).toLocaleString()}
                              </time>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                    <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={!hasMore}
                          onClick={() => setCurrentPage((page) => page + 1)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </footer>
                  </section>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-bold text-slate-950">
                        Activity by Action
                      </h3>
                      <div className="mt-4 space-y-3">
                        {(dashboard?.actions ?? []).length === 0 ? (
                          <p className="text-xs text-slate-500">
                            Koi action analytics available nahi.
                          </p>
                        ) : (
                          dashboard?.actions.map((item) => (
                            <div
                              key={item.action}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="text-xs text-slate-700">
                                {formatActionLabel(item.action)}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
                                {item.count}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-bold text-slate-950">
                        Editor Activity
                      </h3>
                      <div className="mt-4 space-y-3">
                        {(dashboard?.editors ?? []).length === 0 ? (
                          <p className="text-xs text-slate-500">
                            Koi editor analytics available nahi.
                          </p>
                        ) : (
                          dashboard?.editors.map((editor) => (
                            <div
                              key={editor.username}
                              className="flex items-center justify-between gap-4"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-800">
                                  {editor.username}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Last {new Date(editor.lastActivityAt).toLocaleString()}
                                </p>
                              </div>
                              <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                                {editor.activityCount}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
