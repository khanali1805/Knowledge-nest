"use client";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Save,
  Settings2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
type NotificationRecord = {
  id: string;
  recipientUsername: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  articleId: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};
type RetentionPolicy = {
  id: string;
  policyKey: string;
  isEnabled: boolean;
  activityRetentionDays: number;
  notificationRetentionDays: number;
  revisionRetentionDays: number;
  lastCleanupAt: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
type NotificationsResponse = {
  success?: boolean;
  notifications?: NotificationRecord[];
  unreadCount?: number;
  message?: string;
};
type RetentionResponse = {
  success?: boolean;
  policy?: RetentionPolicy;
  message?: string;
};
async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
function getSeverityClasses(severity: string): string {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (severity === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  return "border-blue-200 bg-blue-50 text-blue-800";
}
export function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [policy, setPolicy] = useState<RetentionPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadNotifications = useCallback(async () => {
    const response = await fetch(
      `/api/admin/notifications?limit=100&unreadOnly=${unreadOnly}`,
      {
        cache: "no-store",
      },
    );
    const result = await readJsonResponse<NotificationsResponse>(response);
    if (!response.ok) {
      throw new Error(result.message ?? "Notifications load nahi huin.");
    }
    setNotifications(result.notifications ?? []);
    setUnreadCount(result.unreadCount ?? 0);
  }, [unreadOnly]);
  const loadRetentionPolicy = useCallback(async () => {
    const response = await fetch("/api/admin/audit-retention", {
      cache: "no-store",
    });
    const result = await readJsonResponse<RetentionResponse>(response);
    if (!response.ok || !result.policy) {
      throw new Error(result.message ?? "Retention policy load nahi hui.");
    }
    setPolicy(result.policy);
  }, []);
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      await Promise.all([loadNotifications(), loadRetentionPolicy()]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Notification center load nahi hua.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadNotifications, loadRetentionPolicy]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshAll]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadNotifications().catch(() => undefined);
    }, 30_000);
    return () => {
      window.clearInterval(timer);
    };
  }, [loadNotifications]);
  async function scanAlerts() {
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/notifications/scan", {
        method: "POST",
      });
      const result = await readJsonResponse<{
        success?: boolean;
        message?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Alert scan nahi hui.");
      }
      setMessage(result.message ?? "Alert scan complete ho gayi.");
      await loadNotifications();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Alert scan nahi hui.");
    } finally {
      setIsWorking(false);
    }
  }
  async function markOne(notification: NotificationRecord) {
    const response = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "mark-one",
        notificationId: notification.id,
        isRead: !notification.isRead,
      }),
    });
    const result = await readJsonResponse<{
      message?: string;
    }>(response);
    if (!response.ok) {
      throw new Error(result.message ?? "Notification update nahi hui.");
    }
    await loadNotifications();
  }
  async function markAll() {
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark-all",
        }),
      });
      const result = await readJsonResponse<{
        message?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Notifications update nahi huin.");
      }
      setMessage(result.message ?? "Notifications read mark ho gayi hain.");
      await loadNotifications();
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Notifications update nahi huin.",
      );
    } finally {
      setIsWorking(false);
    }
  }
  async function deleteNotification(notificationId: string) {
    setError("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
        }),
      });
      const result = await readJsonResponse<{
        message?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Notification delete nahi hui.");
      }
      await loadNotifications();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Notification delete nahi hui.",
      );
    }
  }
  async function saveRetentionPolicy() {
    if (!policy) {
      return;
    }
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/audit-retention", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEnabled: policy.isEnabled,
          activityRetentionDays: policy.activityRetentionDays,
          notificationRetentionDays: policy.notificationRetentionDays,
          revisionRetentionDays: policy.revisionRetentionDays,
        }),
      });
      const result = await readJsonResponse<RetentionResponse>(response);
      if (!response.ok || !result.policy) {
        throw new Error(result.message ?? "Retention policy save nahi hui.");
      }
      setPolicy(result.policy);
      setMessage(result.message ?? "Retention policy save ho gayi.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Retention policy save nahi hui.",
      );
    } finally {
      setIsWorking(false);
    }
  }
  async function runCleanup() {
    const confirmed = window.confirm("Audit retention cleanup abhi run karni hai?");
    if (!confirmed) {
      return;
    }
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/audit-retention", {
        method: "POST",
      });
      const result = await readJsonResponse<{
        message?: string;
        cleanup?: {
          activityLogsDeleted?: number;
          notificationsDeleted?: number;
          revisionsDeleted?: number;
        };
      }>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Retention cleanup nahi hui.");
      }
      setMessage(
        [
          result.message ?? "Retention cleanup complete ho gayi.",
          `Activities: ${result.cleanup?.activityLogsDeleted ?? 0}`,
          `Notifications: ${result.cleanup?.notificationsDeleted ?? 0}`,
          `Revisions: ${result.cleanup?.revisionsDeleted ?? 0}`,
        ].join(" · "),
      );
      await refreshAll();
    } catch (cleanupError) {
      setError(
        cleanupError instanceof Error
          ? cleanupError.message
          : "Retention cleanup nahi hui.",
      );
    } finally {
      setIsWorking(false);
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-violet-700" />
              <h2 className="text-lg font-black text-slate-950">
                Collaboration Notifications
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {unreadCount} unread collaboration alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => void scanAlerts()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {isWorking ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              Scan Alerts
            </button>
            <button
              type="button"
              disabled={isWorking || unreadCount === 0}
              onClick={() => void markAll()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setUnreadOnly(event.target.checked)}
          />
          Sirf unread notifications
        </label>
        {message ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
        <div className="mt-5 space-y-3">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Koi notification available nahi hai.
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={[
                  "rounded-xl border p-4",
                  getSeverityClasses(notification.severity),
                  notification.isRead ? "opacity-70" : "",
                ].join(" ")}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {notification.severity === "critical" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      <h3 className="text-sm font-bold">{notification.title}</h3>
                      {!notification.isRead ? (
                        <span className="rounded-full bg-current/10 px-2 py-0.5 text-[10px] font-black">
                          NEW
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm">{notification.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] opacity-75">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.articleId ? (
                        <Link
                          href={`/admin/articles/${notification.articleId}/edit`}
                          className="font-bold underline"
                        >
                          Open Article
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void markOne(notification)}
                      className="rounded-lg border border-current/20 px-3 py-2 text-xs font-semibold"
                    >
                      {notification.isRead ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete notification"
                      onClick={() => void deleteNotification(notification.id)}
                      className="rounded-lg border border-current/20 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-black text-slate-950">Audit Retention Policy</h2>
        </div>
        {policy ? (
          <>
            <label className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={policy.isEnabled}
                onChange={(event) =>
                  setPolicy({
                    ...policy,
                    isEnabled: event.target.checked,
                  })
                }
              />
              Automatic audit retention enabled
            </label>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-xs font-bold text-slate-700">
                Activity retention days
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={policy.activityRetentionDays}
                  onChange={(event) =>
                    setPolicy({
                      ...policy,
                      activityRetentionDays: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Notification retention days
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={policy.notificationRetentionDays}
                  onChange={(event) =>
                    setPolicy({
                      ...policy,
                      notificationRetentionDays: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Autosave revision retention days
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={policy.revisionRetentionDays}
                  onChange={(event) =>
                    setPolicy({
                      ...policy,
                      revisionRetentionDays: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isWorking}
                onClick={() => void saveRetentionPolicy()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Retention Policy
              </button>
              <button
                type="button"
                disabled={isWorking}
                onClick={() => void runCleanup()}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Run Cleanup Now
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Last cleanup:{" "}
              {policy.lastCleanupAt
                ? new Date(policy.lastCleanupAt).toLocaleString()
                : "Abhi tak cleanup run nahi hui."}
            </p>
          </>
        ) : null}
      </section>
    </div>
  );
}
