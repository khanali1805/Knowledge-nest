export const UTILITY_SESSION_SCHEMA_VERSION = 1 as const;
export type UtilitySessionSchemaVersion = typeof UTILITY_SESSION_SCHEMA_VERSION;
export type UtilityPlanValue = string | number | boolean | null;
export type UtilityPlanValues = Record<string, UtilityPlanValue>;
export type UtilityProgressState = "not-started" | "in-progress" | "complete";
export type UtilityReminderCadence = "none" | "once" | "daily" | "weekly";
export type UtilityReminderDraft = {
  enabled: boolean;
  cadence: UtilityReminderCadence;
  localTime: string | null;
  nextLocalDate: string | null;
};
export type UtilityPlanSession = {
  schemaVersion: UtilitySessionSchemaVersion;
  sessionId: string;
  utilitySlug: string;
  categorySlug: string;
  values: UtilityPlanValues;
  progress: UtilityProgressState;
  reminder: UtilityReminderDraft;
  createdAt: string;
  updatedAt: string;
};
export type UtilitySessionValidationResult =
  | {
      valid: true;
      value: UtilityPlanSession;
      errors: [];
    }
  | {
      valid: false;
      value: null;
      errors: string[];
    };
const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UTILITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_PROGRESS = new Set<UtilityProgressState>([
  "not-started",
  "in-progress",
  "complete",
]);
const VALID_CADENCE = new Set<UtilityReminderCadence>([
  "none",
  "once",
  "daily",
  "weekly",
]);
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}
function isUtilityPlanValue(value: unknown): value is UtilityPlanValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}
function validateValues(value: unknown): value is UtilityPlanValues {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(isUtilityPlanValue);
}
function validateReminder(value: unknown): value is UtilityReminderDraft {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.enabled !== "boolean") {
    return false;
  }
  if (
    typeof value.cadence !== "string" ||
    !VALID_CADENCE.has(value.cadence as UtilityReminderCadence)
  ) {
    return false;
  }
  if (
    value.localTime !== null &&
    (typeof value.localTime !== "string" || !LOCAL_TIME_PATTERN.test(value.localTime))
  ) {
    return false;
  }
  if (
    value.nextLocalDate !== null &&
    (typeof value.nextLocalDate !== "string" ||
      !LOCAL_DATE_PATTERN.test(value.nextLocalDate))
  ) {
    return false;
  }
  return true;
}
export function createUtilitySession(
  utilitySlug: string,
  categorySlug: string,
  values: UtilityPlanValues = {},
): UtilityPlanSession {
  const cleanUtilitySlug = utilitySlug.trim();
  const cleanCategorySlug = categorySlug.trim();
  if (!UTILITY_SLUG_PATTERN.test(cleanUtilitySlug)) {
    throw new Error("Invalid utility slug.");
  }
  if (!CATEGORY_SLUG_PATTERN.test(cleanCategorySlug)) {
    throw new Error("Invalid category slug.");
  }
  if (!validateValues(values)) {
    throw new Error("Invalid utility plan values.");
  }
  const now = new Date().toISOString();
  return {
    schemaVersion: UTILITY_SESSION_SCHEMA_VERSION,
    sessionId: crypto.randomUUID(),
    utilitySlug: cleanUtilitySlug,
    categorySlug: cleanCategorySlug,
    values: {
      ...values,
    },
    progress: "not-started",
    reminder: {
      enabled: false,
      cadence: "none",
      localTime: null,
      nextLocalDate: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}
export function validateUtilitySession(
  candidate: unknown,
): UtilitySessionValidationResult {
  const errors: string[] = [];
  if (!isRecord(candidate)) {
    return {
      valid: false,
      value: null,
      errors: ["Utility session must be an object."],
    };
  }
  if (candidate.schemaVersion !== UTILITY_SESSION_SCHEMA_VERSION) {
    errors.push("Unsupported utility session schema version.");
  }
  if (typeof candidate.sessionId !== "string" || !candidate.sessionId.trim()) {
    errors.push("Session ID is required.");
  }
  if (
    typeof candidate.utilitySlug !== "string" ||
    !UTILITY_SLUG_PATTERN.test(candidate.utilitySlug)
  ) {
    errors.push("Utility slug is invalid.");
  }
  if (
    typeof candidate.categorySlug !== "string" ||
    !CATEGORY_SLUG_PATTERN.test(candidate.categorySlug)
  ) {
    errors.push("Category slug is invalid.");
  }
  if (!validateValues(candidate.values)) {
    errors.push("Utility values are invalid.");
  }
  if (
    typeof candidate.progress !== "string" ||
    !VALID_PROGRESS.has(candidate.progress as UtilityProgressState)
  ) {
    errors.push("Progress state is invalid.");
  }
  if (!validateReminder(candidate.reminder)) {
    errors.push("Reminder draft is invalid.");
  }
  if (!isIsoDateTime(candidate.createdAt)) {
    errors.push("Created timestamp is invalid.");
  }
  if (!isIsoDateTime(candidate.updatedAt)) {
    errors.push("Updated timestamp is invalid.");
  }
  if (errors.length > 0) {
    return {
      valid: false,
      value: null,
      errors,
    };
  }
  return {
    valid: true,
    value: candidate as UtilityPlanSession,
    errors: [],
  };
}
export function serializeUtilitySession(session: UtilityPlanSession): string {
  const validation = validateUtilitySession(session);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }
  return JSON.stringify(validation.value);
}
export function parseUtilitySession(serialized: string): UtilitySessionValidationResult {
  try {
    const candidate = JSON.parse(serialized) as unknown;
    return validateUtilitySession(candidate);
  } catch {
    return {
      valid: false,
      value: null,
      errors: ["Utility session JSON is invalid."],
    };
  }
}
export function updateUtilitySessionValues(
  session: UtilityPlanSession,
  values: UtilityPlanValues,
): UtilityPlanSession {
  if (!validateValues(values)) {
    throw new Error("Invalid utility values.");
  }
  return {
    ...session,
    values: {
      ...session.values,
      ...values,
    },
    progress: "in-progress",
    updatedAt: new Date().toISOString(),
  };
}
export function completeUtilitySession(session: UtilityPlanSession): UtilityPlanSession {
  return {
    ...session,
    progress: "complete",
    updatedAt: new Date().toISOString(),
  };
}
export function updateUtilityReminderDraft(
  session: UtilityPlanSession,
  reminder: UtilityReminderDraft,
): UtilityPlanSession {
  if (!validateReminder(reminder)) {
    throw new Error("Invalid reminder draft.");
  }
  return {
    ...session,
    reminder: {
      ...reminder,
    },
    updatedAt: new Date().toISOString(),
  };
}
