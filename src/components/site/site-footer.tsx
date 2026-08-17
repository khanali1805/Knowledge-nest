/* eslint-disable @next/next/no-img-element -- Existing dynamic CMS media requires native image rendering. */

import Link from "next/link";
import type { CSSProperties } from "react";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { getSiteShellLayout } from "@/lib/site-shell-runtime";
export async function SiteFooter() {
  const layout = await getSiteShellLayout();
  const currentYear = new Date().getFullYear();
  const style = {
    "--site-primary": layout.primaryColour,
    "--site-secondary": layout.secondaryColour,
    "--site-accent": layout.accentColour,
    "--site-heading-font": layout.headingFont,
    "--site-body-font": layout.bodyFont,
  } as CSSProperties;
  return (
    <footer style={style} className="bg-[var(--site-primary)] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-8">
          <div>
            <h2
              className="text-3xl font-black"
              style={{
                fontFamily: "var(--site-heading-font)",
              }}
            >
              Stay informed with {layout.websiteName}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/70">
              Receive newly published articles, featured stories and important updates
              directly in your inbox.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            {layout.logoUrl ? (
              <img
                decoding="async"
                loading="lazy"
                src={layout.logoUrl}
                alt={layout.websiteName}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-black text-[var(--site-primary)]">
                {layout.websiteName.charAt(0).toUpperCase()}
              </span>
            )}
            <span
              className="text-xl font-black"
              style={{
                fontFamily: "var(--site-heading-font)",
              }}
            >
              {layout.websiteName}
            </span>
          </Link>
          <p className="mt-5 text-sm leading-7 text-white/70">
            A complete publishing platform for useful articles, knowledge, news and
            category-focused content.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/20"
            >
              F
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/20"
            >
              I
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/20"
            >
              Y
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/20"
            >
              L
            </a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-black tracking-[0.18em] text-white/60 uppercase">
            Important Pages
          </h2>
          <nav className="mt-5 grid gap-3 text-sm">
            <Link href="/about-us" className="text-white/80 hover:text-white">
              About
            </Link>
            <Link href="/contact-us" className="text-white/80 hover:text-white">
              Contact
            </Link>
            <Link href="/privacy-policy" className="text-white/80 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="text-white/80 hover:text-white">
              Terms and Conditions
            </Link>
            <Link href="/disclaimer" className="text-white/80 hover:text-white">
              Disclaimer
            </Link>
            <Link href="/search" className="text-white/80 hover:text-white">
              Search
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-black tracking-[0.18em] text-white/60 uppercase">
            Explore
          </h2>
          <nav className="mt-5 grid gap-3 text-sm">
            <Link href="/latest" className="text-white/80 hover:text-white">
              Latest Articles
            </Link>
            <Link href="/featured" className="text-white/80 hover:text-white">
              Featured Articles
            </Link>
            <Link href="/popular" className="text-white/80 hover:text-white">
              Popular Articles
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-white/60 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            Â© {currentYear} {layout.websiteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white">
              Terms
            </Link>
            <Link href="/contact-us" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
