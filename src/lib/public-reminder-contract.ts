export const PUBLIC_REMINDER_FREQUENCIES = [
  "once",
  "daily",
  "weekly",
  "monthly",
] as const;
export type PublicReminderFrequency = (typeof PUBLIC_REMINDER_FREQUENCIES)[number];
export const PUBLIC_REMINDER_STATUSES = ["active", "completed", "cancelled"] as const;
export type PublicReminderStatus = (typeof PUBLIC_REMINDER_STATUSES)[number];
export type PublicReminderDraft = {
  enabled: boolean;
  title: string;
  note: string;
  date: string;
  time: string;
  timezone: string;
  frequency: PublicReminderFrequency;
};
export type PublicReminderContext = {
  utilitySlug: string;
  categorySlug: string;
  sessionId: string | null;
};
export type PublicReminderCreateInput = PublicReminderContext & {
  title: string;
  note: string | null;
  scheduledFor: string;
  timezone: string;
  frequency: PublicReminderFrequency;
};
export type PublicReminderRecord = PublicReminderCreateInput & {
  id: string;
  status: PublicReminderStatus;
  lastTriggeredAt: string | null;
  nextTriggerAt: string;
  createdAt: string;
  updatedAt: string;
};
export const DEFAULT_PUBLIC_REMINDER_DRAFT: PublicReminderDraft = {
  enabled: false,
  title: "",
  note: "",
  date: "",
  time: "09:00",
  timezone: "UTC",
  frequency: "once",
};
export function isPublicReminderFrequency(
  value: unknown,
): value is PublicReminderFrequency {
  return (
    typeof value === "string" &&
    (PUBLIC_REMINDER_FREQUENCIES as readonly string[]).includes(value)
  );
}
export function isPublicReminderStatus(value: unknown): value is PublicReminderStatus {
  return (
    typeof value === "string" &&
    (PUBLIC_REMINDER_STATUSES as readonly string[]).includes(value)
  );
}
export function normalisePublicReminderText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, maxLength);
}
export function normalisePublicReminderTimezone(value: unknown): string {
  const timezone = normalisePublicReminderText(value, 80);
  return timezone || "UTC";
}
export function normalisePublicReminderDraft(
  value?: Partial<PublicReminderDraft> | null,
): PublicReminderDraft {
  return {
    enabled: value?.enabled === true,
    title: normalisePublicReminderText(value?.title, 160),
    note: normalisePublicReminderText(value?.note, 1000),
    date: normalisePublicReminderText(value?.date, 10),
    time: normalisePublicReminderText(value?.time, 5) || "09:00",
    timezone: normalisePublicReminderTimezone(value?.timezone),
    frequency: isPublicReminderFrequency(value?.frequency) ? value.frequency : "once",
  };
}
export function publicReminderDraftIsReady(draft: PublicReminderDraft): boolean {
  return Boolean(
    draft.enabled &&
    draft.title.trim() &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.date) &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time) &&
    draft.timezone.trim(),
  );
}
export function createPublicReminderScheduledFor({
  date,
  time,
}: {
  date: string;
  time: string;
}): string {
  const cleanDate = normalisePublicReminderText(date, 10);
  const cleanTime = normalisePublicReminderText(time, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error("Reminder date valid nahi hai.");
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cleanTime)) {
    throw new Error("Reminder time valid nahi hai.");
  }
  return `${cleanDate}T${cleanTime}:00`;
}
export function buildPublicReminderCreateInput({
  draft,
  utilitySlug,
  categorySlug,
  sessionId,
}: {
  draft: PublicReminderDraft;
  utilitySlug: string;
  categorySlug: string;
  sessionId?: string | null;
}): PublicReminderCreateInput {
  const normalizedDraft = normalisePublicReminderDraft(draft);
  if (!publicReminderDraftIsReady(normalizedDraft)) {
    throw new Error("Reminder details complete nahi hain.");
  }
  const cleanUtilitySlug = normalisePublicReminderText(utilitySlug, 160);
  const cleanCategorySlug = normalisePublicReminderText(categorySlug, 160);
  if (!cleanUtilitySlug) {
    throw new Error("Reminder ke liye utility slug required hai.");
  }
  if (!cleanCategorySlug) {
    throw new Error("Reminder ke liye category slug required hai.");
  }
  return {
    utilitySlug: cleanUtilitySlug,
    categorySlug: cleanCategorySlug,
    sessionId: normalisePublicReminderText(sessionId, 120) || null,
    title: normalizedDraft.title,
    note: normalizedDraft.note || null,
    scheduledFor: createPublicReminderScheduledFor({
      date: normalizedDraft.date,
      time: normalizedDraft.time,
    }),
    timezone: normalizedDraft.timezone,
    frequency: normalizedDraft.frequency,
  };
}
