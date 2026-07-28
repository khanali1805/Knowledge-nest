import Link from "next/link";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
import { getActiveTheme } from "@/lib/theme/theme-store";
function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
export async function SiteHeader() {
  const [theme, settings] = await Promise.all([
    getActiveTheme(),
    getPublicSiteSettings(),
  ]);
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{
        borderColor: theme.colours.border,
        backgroundColor: `${theme.colours.background}F2`,
        color: theme.colours.foreground,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="min-w-0 text-xl font-bold tracking-tight"
          style={{
            color: theme.colours.primary,
            fontFamily: theme.typography.headingFont,
          }}
        >
          {settings.siteName}
        </Link>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-5 lg:flex"
        >
          {theme.navigation.slice(0, 7).map((item, index) => (
            <Link
              key={`${item}-${index}`}
              href={index === 0 ? "/" : `/category/${createSlug(item)}`}
              className="text-sm font-medium transition-opacity hover:opacity-65"
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{
              borderColor: theme.colours.border,
            }}
          >
            Search
          </Link>
          <Link
            href="/admin/themes"
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{
              backgroundColor: theme.colours.primary,
              color: theme.colours.background,
            }}
          >
            Theme Studio
          </Link>
        </div>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="overflow-x-auto border-t px-4 py-3 lg:hidden"
        style={{
          borderColor: theme.colours.border,
        }}
      >
        <div className="flex min-w-max gap-4">
          {theme.navigation.map((item, index) => (
            <Link
              key={`${item}-${index}`}
              href={index === 0 ? "/" : `/category/${createSlug(item)}`}
              className="text-xs font-semibold"
            >
              {item}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
export default SiteHeader;
