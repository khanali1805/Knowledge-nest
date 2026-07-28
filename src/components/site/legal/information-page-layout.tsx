import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
type InformationPageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};
export function InformationPageLayout({
  title,
  description,
  children,
}: InformationPageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main>
        <header className="border-border bg-muted/30 border-b">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="text-muted-foreground mt-5 max-w-3xl text-base leading-7 sm:text-lg">
              {description}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-8 text-base leading-8">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
