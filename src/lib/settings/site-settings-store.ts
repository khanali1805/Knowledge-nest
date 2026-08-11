import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import type { SiteSettingsInput } from "@/lib/settings/validation";
import { getSiteUrl } from "@/lib/site-url";
export const SITE_SETTING_KEYS = [
  "siteName",
  "tagline",
  "siteUrl",
  "adminEmail",
  "postsPerPage",
  "language",
  "timezone",
  "indexSite",
] as const;
export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];
export const defaultSiteSettings: SiteSettingsInput = {
  siteName: "Knowledge Nest",
  tagline: "Trusted knowledge for everyone.",
  siteUrl: getSiteUrl(),
  adminEmail: "admin@example.com",
  postsPerPage: 12,
  language: "en",
  timezone: "UTC",
  indexSite: true,
};
type SettingRow = {
  key: string;
  value: string | null;
};
function parseBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
}
function parseNumber(value: string | null | undefined, fallback: number): number {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue)) {
    return fallback;
  }
  return parsedValue;
}
function createSettingsFromRows(rows: SettingRow[]): SiteSettingsInput {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    siteName: values.get("siteName") || defaultSiteSettings.siteName,
    tagline: values.get("tagline") ?? defaultSiteSettings.tagline,
    siteUrl: values.get("siteUrl") || defaultSiteSettings.siteUrl,
    adminEmail: values.get("adminEmail") || defaultSiteSettings.adminEmail,
    postsPerPage: parseNumber(
      values.get("postsPerPage"),
      defaultSiteSettings.postsPerPage,
    ),
    language: values.get("language") === "en" ? "en" : defaultSiteSettings.language,
    timezone: values.get("timezone") || defaultSiteSettings.timezone,
    indexSite: parseBoolean(values.get("indexSite"), defaultSiteSettings.indexSite),
  };
}
export async function getSiteSettings(): Promise<SiteSettingsInput> {
  const rows = await db
    .select({
      key: siteSettings.key,
      value: siteSettings.value,
    })
    .from(siteSettings)
    .where(inArray(siteSettings.key, [...SITE_SETTING_KEYS]))
    .orderBy(asc(siteSettings.sortOrder), asc(siteSettings.key));
  return createSettingsFromRows(rows);
}
export async function getPublicSiteSettings(): Promise<SiteSettingsInput> {
  try {
    return await getSiteSettings();
  } catch {
    return defaultSiteSettings;
  }
}
export async function saveSiteSettings(
  input: SiteSettingsInput,
): Promise<SiteSettingsInput> {
  const now = new Date();
  const records = [
    {
      key: "siteName",
      value: input.siteName,
      sortOrder: 10,
      isPublic: true,
    },
    {
      key: "tagline",
      value: input.tagline,
      sortOrder: 20,
      isPublic: true,
    },
    {
      key: "siteUrl",
      value: input.siteUrl,
      sortOrder: 30,
      isPublic: true,
    },
    {
      key: "adminEmail",
      value: input.adminEmail,
      sortOrder: 40,
      isPublic: false,
    },
    {
      key: "postsPerPage",
      value: String(input.postsPerPage),
      sortOrder: 50,
      isPublic: true,
    },
    {
      key: "language",
      value: input.language,
      sortOrder: 60,
      isPublic: true,
    },
    {
      key: "timezone",
      value: input.timezone,
      sortOrder: 70,
      isPublic: true,
    },
    {
      key: "indexSite",
      value: String(input.indexSite),
      sortOrder: 80,
      isPublic: true,
    },
  ] as const;
  await db.transaction(async (transaction) => {
    for (const record of records) {
      const [existingSetting] = await transaction
        .select({
          id: siteSettings.id,
        })
        .from(siteSettings)
        .where(eq(siteSettings.key, record.key))
        .limit(1);
      if (existingSetting) {
        await transaction
          .update(siteSettings)
          .set({
            group: "general",
            value: record.value,
            jsonValue: null,
            isPublic: record.isPublic,
            sortOrder: record.sortOrder,
            updatedAt: now,
          })
          .where(eq(siteSettings.id, existingSetting.id));
      } else {
        await transaction.insert(siteSettings).values({
          group: "general",
          key: record.key,
          value: record.value,
          jsonValue: null,
          isPublic: record.isPublic,
          sortOrder: record.sortOrder,
          updatedAt: now,
        });
      }
    }
  });
  return getSiteSettings();
}
