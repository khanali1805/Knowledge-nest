import type { Metadata } from "next";
import { Palette, Sparkles } from "lucide-react";
import { ThemeStudio } from "@/components/admin/themes/theme-studio";
export const metadata: Metadata = {
  title: "Theme Studio | Knowledge Nest",
  description:
    "Manage website niches, theme presets, colours, typography and homepage layouts.",
};
export default function ThemeStudioPage() {
  return (
    <div className="space-y-6">
      <section className="border-border bg-background relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8">
        <div className="bg-foreground/5 pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="bg-foreground text-background inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Phase 8 — Advanced Frontend UI/UX
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Theme Studio
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
              Create niche-based themes, customise typography and colours, reorder
              homepage sections, preview responsive layouts, and manage theme backups.
            </p>
          </div>
        </div>
      </section>
      <ThemeStudio />
    </div>
  );
}
