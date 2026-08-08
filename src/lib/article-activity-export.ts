import "server-only";
export type ExportableArticleActivity = {
  id: string;
  articleId: string;
  username: string;
  action: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
};
function normaliseDate(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toISOString();
}
function escapeCsvCell(value: unknown): string {
  const serialisedValue =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return '"' + serialisedValue.replaceAll('"', '""') + '"';
}
export function createActivityCsv(activities: ExportableArticleActivity[]): string {
  const header = [
    "ID",
    "Article ID",
    "Username",
    "Action",
    "Summary",
    "Metadata",
    "Created At",
  ];
  const rows = activities.map((activity) => [
    activity.id,
    activity.articleId,
    activity.username,
    activity.action,
    activity.summary,
    activity.metadata,
    normaliseDate(activity.createdAt),
  ]);
  return [
    header.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");
}
export function createActivityJson(activities: ExportableArticleActivity[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      total: activities.length,
      activities: activities.map((activity) => ({
        ...activity,
        createdAt: normaliseDate(activity.createdAt),
      })),
    },
    null,
    2,
  );
}
export function createSafeExportFilename({
  articleId,
  format,
}: {
  articleId: string;
  format: "csv" | "json";
}): string {
  const safeArticleId = articleId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `article-${safeArticleId}` + `-activity-${timestamp}.${format}`;
}
