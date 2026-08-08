"use client";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock3,
  CloudCog,
  LoaderCircle,
  Mail,
  Play,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Webhook,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
type NotificationPreferences = {
  username: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  emailAddress: string | null;
  webhookUrl: string | null;
  minimumSeverity: string;
  collaborationAlertsEnabled: boolean;
  criticalActivityEnabled: boolean;
  multipleEditorsEnabled: boolean;
  retentionAlertsEnabled: boolean;
  digestEnabled: boolean;
  digestIntervalMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
};
type DeliveryRecord = {
  id: string;
  notificationId: string;
  recipientUsername: string;
  channel: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  notificationTitle?: string | null;
  notificationMessage?: string | null;
  notificationSeverity?: string | null;
};
type SchedulerRun = {
  id: string;
  trigger: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  alertsCreated: number;
  deliveriesQueued: number;
  deliveriesProcessed: number;
  deliveriesSucceeded: number;
  deliveriesFailed: number;
  activityLogsDeleted: number;
  notificationsDeleted: number;
  revisionsDeleted: number;
  errorMessage: string | null;
};
type PreferencesResponse = {
  success?: boolean;
  preferences?: NotificationPreferences;
  message?: string;
};
type DeliveryResponse = {
  success?: boolean;
  deliveries?: DeliveryRecord[];
  schedulerRuns?: SchedulerRun[];
  message?: string;
};
type SchedulerResponse = {
  success?: boolean;
  result?: {
    status?: string;
    alertsCreated?: number;
    deliveriesQueued?: number;
    deliveriesProcessed?: number;
    deliveriesSucceeded?: number;
    deliveriesFailed?: number;
  };
  message?: string;
};
const DEFAULT_PREFERENCES: NotificationPreferences = {
  username: "",
  inAppEnabled: true,
  emailEnabled: false,
  webhookEnabled: false,
  emailAddress: null,
  webhookUrl: null,
  minimumSeverity: "info",
  collaborationAlertsEnabled: true,
  criticalActivityEnabled: true,
  multipleEditorsEnabled: true,
  retentionAlertsEnabled: true,
  digestEnabled: false,
  digestIntervalMinutes: 60,
  quietHoursEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: "UTC",
};
async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
function formatStatusLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
function getStatusClasses(status: string): string {
  switch (status) {
    case "delivered":
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "failed":
      return "border-red-200 bg-red-50 text-red-800";
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "pending":
    case "retry":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}
function getChannelIcon(channel: string) {
  switch (channel) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "webhook":
      return <Webhook className="h-4 w-4" />;
    default:
      return <BellRing className="h-4 w-4" />;
  }
}
export function NotificationDeliveryCenter() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [schedulerRuns, setSchedulerRuns] = useState<SchedulerRun[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const deliverySummary = useMemo(() => {
    const result = {
      total: deliveries.length,
      pending: 0,
      delivered: 0,
      failed: 0,
    };
    for (const delivery of deliveries) {
      if (
        delivery.status === "pending" ||
        delivery.status === "retry" ||
        delivery.status === "processing"
      ) {
        result.pending += 1;
      }
      if (delivery.status === "delivered") {
        result.delivered += 1;
      }
      if (delivery.status === "failed") {
        result.failed += 1;
      }
    }
    return result;
  }, [deliveries]);
  const loadPreferences = useCallback(async () => {
    const response = await fetch("/api/admin/notification-preferences", {
      cache: "no-store",
    });
    const result = await readJsonResponse<PreferencesResponse>(response);
    if (!response.ok || !result.preferences) {
      throw new Error(result.message ?? "Notification preferences load nahi huin.");
    }
    setPreferences({
      ...DEFAULT_PREFERENCES,
      ...result.preferences,
      emailAddress: result.preferences.emailAddress ?? null,
      webhookUrl: result.preferences.webhookUrl ?? null,
      quietHoursStart: result.preferences.quietHoursStart ?? null,
      quietHoursEnd: result.preferences.quietHoursEnd ?? null,
    });
  }, []);
  const loadDeliveries = useCallback(async () => {
    const searchParameters = new URLSearchParams();
    searchParameters.set("limit", "100");
    if (statusFilter) {
      searchParameters.set("status", statusFilter);
    }
    if (channelFilter) {
      searchParameters.set("channel", channelFilter);
    }
    const response = await fetch(
      `/api/admin/notification-deliveries?${searchParameters.toString()}`,
      {
        cache: "no-store",
      },
    );
    const result = await readJsonResponse<DeliveryResponse>(response);
    if (!response.ok) {
      throw new Error(result.message ?? "Notification deliveries load nahi huin.");
    }
    setDeliveries(result.deliveries ?? []);
    setSchedulerRuns(result.schedulerRuns ?? []);
  }, [channelFilter, statusFilter]);
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      await Promise.all([loadPreferences(), loadDeliveries()]);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Step 9 data load nahi hua.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadDeliveries, loadPreferences]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshAll]);
  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadDeliveries().catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Delivery monitor refresh nahi hua.",
        );
      });
    }, 30_000);
    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadDeliveries]);
  async function savePreferences() {
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/notification-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inAppEnabled: preferences.inAppEnabled,
          emailEnabled: preferences.emailEnabled,
          webhookEnabled: preferences.webhookEnabled,
          emailAddress: preferences.emailAddress || null,
          webhookUrl: preferences.webhookUrl || null,
          minimumSeverity: preferences.minimumSeverity,
          collaborationAlertsEnabled: preferences.collaborationAlertsEnabled,
          criticalActivityEnabled: preferences.criticalActivityEnabled,
          multipleEditorsEnabled: preferences.multipleEditorsEnabled,
          retentionAlertsEnabled: preferences.retentionAlertsEnabled,
          digestEnabled: preferences.digestEnabled,
          digestIntervalMinutes: preferences.digestIntervalMinutes,
          quietHoursEnabled: preferences.quietHoursEnabled,
          quietHoursStart: preferences.quietHoursStart || null,
          quietHoursEnd: preferences.quietHoursEnd || null,
          timezone: preferences.timezone,
        }),
      });
      const result = await readJsonResponse<PreferencesResponse>(response);
      if (!response.ok || !result.preferences) {
        throw new Error(result.message ?? "Notification preferences save nahi huin.");
      }
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...result.preferences,
      });
      setMessage(result.message ?? "Notification preferences save ho gayin.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Notification preferences save nahi huin.",
      );
    } finally {
      setIsWorking(false);
    }
  }
  async function queueDeliveries() {
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/notification-deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 250,
        }),
      });
      const result = await readJsonResponse<{
        queuedCount?: number;
        message?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Delivery queue create nahi hui.");
      }
      setMessage(result.message ?? `${result.queuedCount ?? 0} deliveries queue huin.`);
      await loadDeliveries();
    } catch (queueError) {
      setError(
        queueError instanceof Error
          ? queueError.message
          : "Delivery queue create nahi hui.",
      );
    } finally {
      setIsWorking(false);
    }
  }
  async function runScheduler() {
    const confirmed = window.confirm(
      "Notification scheduler, alert scan aur retention cleanup abhi run karna hai?",
    );
    if (!confirmed) {
      return;
    }
    setIsWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/notification-scheduler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runAlertScan: true,
          runRetentionCleanup: true,
          deliveryLimit: 50,
        }),
      });
      const result = await readJsonResponse<SchedulerResponse>(response);
      if (!response.ok) {
        throw new Error(result.message ?? "Notification scheduler run nahi hua.");
      }
      setMessage(
        [
          result.message ?? "Notification scheduler complete hua.",
          `Alerts: ${result.result?.alertsCreated ?? 0}`,
          `Queued: ${result.result?.deliveriesQueued ?? 0}`,
          `Processed: ${result.result?.deliveriesProcessed ?? 0}`,
          `Delivered: ${result.result?.deliveriesSucceeded ?? 0}`,
          `Failed: ${result.result?.deliveriesFailed ?? 0}`,
        ].join(" · "),
      );
      await loadDeliveries();
    } catch (schedulerError) {
      setError(
        schedulerError instanceof Error
          ? schedulerError.message
          : "Notification scheduler run nahi hua.",
      );
    } finally {
      setIsWorking(false);
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CloudCog className="h-5 w-5 text-indigo-700" />
              <h2 className="text-lg font-black text-slate-950">
                Step 9 Delivery Scheduler
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Automated alert scan, retention cleanup aur multi-channel delivery controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => void queueDeliveries()}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Queue Deliveries
            </button>
            <button
              type="button"
              disabled={isWorking}
              onClick={() => void runScheduler()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {isWorking ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Scheduler
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
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
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-black text-slate-950">Notification Preferences</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={preferences.inAppEnabled}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  inAppEnabled: event.target.checked,
                })
              }
            />
            <BellRing className="h-4 w-4" />
            In-App Delivery
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  emailEnabled: event.target.checked,
                })
              }
            />
            <Mail className="h-4 w-4" />
            Email Delivery
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={preferences.webhookEnabled}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  webhookEnabled: event.target.checked,
                })
              }
            />
            <Webhook className="h-4 w-4" />
            Webhook Delivery
          </label>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">
            Email Address
            <input
              type="email"
              value={preferences.emailAddress ?? ""}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  emailAddress: event.target.value,
                })
              }
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Webhook URL
            <input
              type="url"
              value={preferences.webhookUrl ?? ""}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  webhookUrl: event.target.value,
                })
              }
              placeholder="https://example.com/webhook"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Minimum Severity
            <select
              value={preferences.minimumSeverity}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  minimumSeverity: event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">
            Timezone
            <input
              type="text"
              value={preferences.timezone}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  timezone: event.target.value,
                })
              }
              placeholder="Asia/Karachi"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              key: "collaborationAlertsEnabled",
              label: "Collaboration Alerts",
            },
            {
              key: "criticalActivityEnabled",
              label: "Critical Activity",
            },
            {
              key: "multipleEditorsEnabled",
              label: "Multiple Editors",
            },
            {
              key: "retentionAlertsEnabled",
              label: "Retention Alerts",
            },
          ].map((option) => (
            <label
              key={option.key}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-xs font-semibold"
            >
              <input
                type="checkbox"
                checked={Boolean(
                  preferences[option.key as keyof NotificationPreferences],
                )}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    [option.key]: event.target.checked,
                  })
                }
              />
              {option.label}
            </label>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={preferences.digestEnabled}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  digestEnabled: event.target.checked,
                })
              }
            />
            Digest Delivery Enabled
          </label>
          <label className="mt-4 block text-xs font-bold text-slate-700">
            Digest Interval Minutes
            <input
              type="number"
              min={5}
              max={10_080}
              value={preferences.digestIntervalMinutes}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  digestIntervalMinutes: Number(event.target.value),
                })
              }
              className="mt-2 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={preferences.quietHoursEnabled}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  quietHoursEnabled: event.target.checked,
                })
              }
            />
            Quiet Hours Enabled
          </label>
          <div className="mt-4 grid max-w-lg gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">
              Start Time
              <input
                type="time"
                value={preferences.quietHoursStart ?? ""}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    quietHoursStart: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              End Time
              <input
                type="time"
                value={preferences.quietHoursEnd ?? ""}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    quietHoursEnd: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          disabled={isWorking}
          onClick={() => void savePreferences()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save Notification Preferences
        </button>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Delivery Monitor</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pending, successful aur failed notification deliveries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="retry">Retry</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            >
              <option value="">All Channels</option>
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-black">{deliverySummary.total}</p>
          </article>
          <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-700">Pending</p>
            <p className="mt-2 text-3xl font-black text-amber-900">
              {deliverySummary.pending}
            </p>
          </article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">Delivered</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {deliverySummary.delivered}
            </p>
          </article>
          <article className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold text-red-700">Failed</p>
            <p className="mt-2 text-3xl font-black text-red-900">
              {deliverySummary.failed}
            </p>
          </article>
        </div>
        <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Koi delivery record available nahi hai.
            </div>
          ) : (
            deliveries.map((delivery) => (
              <article
                key={delivery.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold">
                        {getChannelIcon(delivery.channel)}
                        {formatStatusLabel(delivery.channel)}
                      </span>
                      <span
                        className={[
                          "rounded-full border px-2 py-1 text-[11px] font-bold",
                          getStatusClasses(delivery.status),
                        ].join(" ")}
                      >
                        {formatStatusLabel(delivery.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {delivery.notificationTitle ?? "Notification Delivery"}
                    </p>
                    {delivery.notificationMessage ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {delivery.notificationMessage}
                      </p>
                    ) : null}
                    {delivery.lastError ? (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        {delivery.lastError}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-xs text-slate-500">
                    <p>
                      Attempts: {delivery.attemptCount}/{delivery.maxAttempts}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {new Date(delivery.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-black text-slate-950">Scheduler Run History</h2>
        </div>
        <div className="mt-5 space-y-3">
          {schedulerRuns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Koi scheduler run available nahi hai.
            </div>
          ) : (
            schedulerRuns.map((run) => (
              <article key={run.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {run.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : run.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                      <span
                        className={[
                          "rounded-full border px-2 py-1 text-[11px] font-bold",
                          getStatusClasses(run.status),
                        ].join(" ")}
                      >
                        {formatStatusLabel(run.status)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Trigger: {formatStatusLabel(run.trigger)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span>Alerts: {run.alertsCreated}</span>
                      <span>Queued: {run.deliveriesQueued}</span>
                      <span>Processed: {run.deliveriesProcessed}</span>
                      <span>Delivered: {run.deliveriesSucceeded}</span>
                      <span>Failed: {run.deliveriesFailed}</span>
                    </div>
                    {run.errorMessage ? (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        {run.errorMessage}
                      </p>
                    ) : null}
                  </div>
                  <time className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(run.startedAt).toLocaleString()}
                  </time>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
