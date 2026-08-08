"use client";
import { LoaderCircle, Save } from "lucide-react";
import { type FormEvent, useState } from "react";
import { readApiResponse } from "@/lib/http/read-api-response";
import type { SiteSettingsInput } from "@/lib/settings/validation";
type SettingsFormProps = {
  initialSettings: SiteSettingsInput;
};
type SettingsApiResponse = {
  settings?: SiteSettingsInput;
  message?: string;
};
const timezones = [
  "UTC",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];
export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [siteName, setSiteName] = useState(initialSettings.siteName);
  const [tagline, setTagline] = useState(initialSettings.tagline);
  const [siteUrl, setSiteUrl] = useState(initialSettings.siteUrl);
  const [adminEmail, setAdminEmail] = useState(initialSettings.adminEmail);
  const [postsPerPage, setPostsPerPage] = useState(String(initialSettings.postsPerPage));
  const [language, setLanguage] = useState<string>(initialSettings.language);
  const [timezone, setTimezone] = useState(initialSettings.timezone);
  const [indexSite, setIndexSite] = useState(initialSettings.indexSite);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteName,
          tagline,
          siteUrl,
          adminEmail,
          postsPerPage: Number(postsPerPage),
          language,
          timezone,
          indexSite,
        }),
      });
      const responseData = await readApiResponse<SettingsApiResponse>(response);
      if (!response.ok || !responseData.settings) {
        throw new Error(responseData.message || "Unable to save site settings.");
      }
      const savedSettings = responseData.settings;
      setSiteName(savedSettings.siteName);
      setTagline(savedSettings.tagline);
      setSiteUrl(savedSettings.siteUrl);
      setAdminEmail(savedSettings.adminEmail);
      setPostsPerPage(String(savedSettings.postsPerPage));
      setLanguage(savedSettings.language);
      setTimezone(savedSettings.timezone);
      setIndexSite(savedSettings.indexSite);
      setMessage(responseData.message || "Site settings saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save site settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {message ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
      <section className="border-border bg-background rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">General Settings</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="site-name" className="mb-2 block text-sm font-medium">
              Site Name
            </label>
            <input
              id="site-name"
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
              maxLength={120}
              required
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="site-url" className="mb-2 block text-sm font-medium">
              Site URL
            </label>
            <input
              id="site-url"
              type="url"
              value={siteUrl}
              onChange={(event) => setSiteUrl(event.target.value)}
              required
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="site-tagline" className="mb-2 block text-sm font-medium">
              Tagline
            </label>
            <input
              id="site-tagline"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              maxLength={255}
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              required
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="posts-per-page" className="mb-2 block text-sm font-medium">
              Posts Per Page
            </label>
            <input
              id="posts-per-page"
              type="number"
              min={1}
              max={100}
              value={postsPerPage}
              onChange={(event) => setPostsPerPage(event.target.value)}
              required
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="site-language" className="mb-2 block text-sm font-medium">
              Language
            </label>
            <select
              id="site-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            >
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label htmlFor="site-timezone" className="mb-2 block text-sm font-medium">
              Time Zone
            </label>
            <select
              id="site-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              disabled={isSaving}
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-4 disabled:opacity-50"
            >
              {!timezones.includes(timezone) ? (
                <option value={timezone}>{timezone}</option>
              ) : null}
              {timezones.map((timezoneOption) => (
                <option key={timezoneOption} value={timezoneOption}>
                  {timezoneOption}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={indexSite}
                onChange={(event) => setIndexSite(event.target.checked)}
                disabled={isSaving}
                className="h-4 w-4"
              />
              Allow search engines to index the website
            </label>
          </div>
        </div>
      </section>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-foreground text-background inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>
    </form>
  );
}
