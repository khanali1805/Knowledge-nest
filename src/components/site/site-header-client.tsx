/* eslint-disable @next/next/no-img-element -- Existing dynamic CMS media requires native image rendering. */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { SiteSearchForm } from "@/components/site/search/site-search-form";
import type { SiteShellLayout } from "@/lib/site-shell-runtime";
type SiteHeaderClientProps = {
  layout: SiteShellLayout;
};
const navigationItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Latest",
    href: "/latest",
  },
  {
    label: "Featured",
    href: "/featured",
  },
] as const;
export function SiteHeaderClient({ layout }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [mobileMenuOpen]);
  const style = {
    "--site-primary": layout.primaryColour,
    "--site-secondary": layout.secondaryColour,
    "--site-accent": layout.accentColour,
    "--site-background": layout.backgroundColour,
    "--site-text": layout.textColour,
    "--site-heading-font": layout.headingFont,
    "--site-body-font": layout.bodyFont,
  } as CSSProperties;
  return (
    <header
      style={style}
      className="relative z-40 border-b border-slate-200 bg-[var(--site-background)] text-[var(--site-text)]"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {layout.logoUrl ? (
            <img
              decoding="async"
              loading="lazy"
              src={layout.logoUrl}
              alt={layout.websiteName}
              className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--site-primary)] text-lg font-black text-white">
              {layout.websiteName.charAt(0).toUpperCase()}
            </span>
          )}
          <span
            className="truncate text-xl font-black sm:text-2xl"
            style={{
              fontFamily: "var(--site-heading-font)",
            }}
          >
            {layout.websiteName}
          </span>
        </Link>
        <nav
          className="ml-auto hidden items-center gap-7 lg:flex"
          aria-label="Primary navigation"
        >
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-sm font-bold transition ${
                  isActive
                    ? "text-[var(--site-accent)]"
                    : "hover:text-[var(--site-accent)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden w-full max-w-xs xl:block">
          <SiteSearchForm compact />
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="ml-auto flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold lg:hidden"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? "Close" : "Menu"}
        </button>
      </div>
      <div className="mx-auto hidden max-w-7xl px-4 pb-4 sm:px-6 lg:block lg:px-8 xl:hidden">
        <SiteSearchForm compact />
      </div>
      {mobileMenuOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-[77px] bottom-0 overflow-y-auto border-t border-slate-200 bg-[var(--site-background)] text-[var(--site-text)] lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
            <SiteSearchForm compact />
          </div>
          <nav
            className="mx-auto grid max-w-7xl gap-2 px-4 py-6 sm:px-6"
            aria-label="Mobile navigation"
          >
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 font-bold transition ${
                    isActive
                      ? "bg-[var(--site-primary)] text-white"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
