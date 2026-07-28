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
export async function SiteFooter() {
  const [theme, settings] = await Promise.all([
    getActiveTheme(),
    getPublicSiteSettings(),
  ]);
  const currentYear = new Date().getFullYear();
  return (
    <footer
      className="mt-16 border-t"
      style={{
        borderColor: theme.colours.border,
        backgroundColor: theme.colours.muted,
        color: theme.colours.foreground,
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p
            className="text-xl font-bold"
            style={{
              color: theme.colours.primary,
              fontFamily: theme.typography.headingFont,
            }}
          >
            {settings.siteName}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 opacity-75">{settings.tagline}</p>
        </div>
        <div>
          <p className="font-semibold">Explore</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {theme.navigation.slice(0, 8).map((item, index) => (
              <Link
                key={`${item}-${index}`}
                href={index === 0 ? "/" : `/category/${createSlug(item)}`}
                className="text-sm opacity-75 transition-opacity hover:opacity-100"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">Information</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/about-us">About Us</Link>
            <Link href="/contact-us">Contact Us</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms and Conditions</Link>
          </div>
        </div>
      </div>
      <div
        className="border-t px-4 py-5 text-center text-xs opacity-75"
        style={{
          borderColor: theme.colours.border,
        }}
      >
        © {currentYear} {settings.siteName}. All rights reserved.
      </div>
    </footer>
  );
}
export default SiteFooter;
