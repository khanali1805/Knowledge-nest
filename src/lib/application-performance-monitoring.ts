type MonitoringFields = Record<string, unknown>;

type MonitoringLevel = "info" | "warn" | "error";

const MAX_STRING_LENGTH = 500;
const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|password|secret|token|api[-_]?key|database_url)/i;

let registered = false;

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value;
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.slice(0, MAX_STRING_LENGTH),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item, index) => sanitizeValue(String(index), item));
  }

  if (typeof value === "object" && value !== null) {
    const output: Record<string, unknown> = {};

    for (const [nestedKey, nestedValue] of Object.entries(value).slice(0, 50)) {
      output[nestedKey] = sanitizeValue(nestedKey, nestedValue);
    }

    return output;
  }

  return String(value);
}

function sanitizeFields(fields: MonitoringFields): MonitoringFields {
  const output: MonitoringFields = {};

  for (const [key, value] of Object.entries(fields).slice(0, 50)) {
    output[key] = sanitizeValue(key, value);
  }

  return output;
}

function writeEvent(
  level: MonitoringLevel,
  event: string,
  fields: MonitoringFields = {},
): void {
  const record = {
    timestamp: new Date().toISOString(),
    service: "knowledge-nest",
    event,
    ...sanitizeFields(fields),
  };

  const line = JSON.stringify(record);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logPerformanceEvent(
  level: MonitoringLevel,
  event: string,
  fields: MonitoringFields = {},
): void {
  writeEvent(level, event, fields);
}

export async function measureAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>,
  fields: MonitoringFields = {},
): Promise<T> {
  const startedAt = performance.now();

  try {
    const result = await operation();

    writeEvent("info", "performance.operation", {
      name,
      outcome: "success",
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      ...fields,
    });

    return result;
  } catch (error) {
    writeEvent("error", "performance.operation", {
      name,
      outcome: "error",
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      error,
      ...fields,
    });

    throw error;
  }
}

export function registerPerformanceMonitoring(): void {
  if (registered) {
    return;
  }

  registered = true;

  const memory = process.memoryUsage();

  writeEvent("info", "application.startup", {
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    nodeVersion: process.version,
    pid: process.pid,
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    memoryRssBytes: memory.rss,
    memoryHeapUsedBytes: memory.heapUsed,
    memoryHeapTotalBytes: memory.heapTotal,
  });
}
