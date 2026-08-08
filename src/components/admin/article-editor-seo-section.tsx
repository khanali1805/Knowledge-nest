"use client";
import { AISEOOptimizationPanel } from "@/components/admin/ai-seo-optimization-panel";
type SEOSectionProps = {
  title: string;
  content: string;
  focusKeyword?: string;
  category?: string;
  onSEOUpdate: (seo: {
    score: number;
    suggestedTitle: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    improvements: string[];
  }) => void;
};
export function ArticleEditorSEOSection({
  title,
  content,
  focusKeyword,
  category,
  onSEOUpdate,
}: SEOSectionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <AISEOOptimizationPanel
        title={title}
        content={content}
        focusKeyword={focusKeyword}
        category={category}
        onOptimized={onSEOUpdate}
      />
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
          SEO Assistant
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">
          Article Optimization Ready
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          AI SEO suggestions will appear here after optimization.
        </p>
      </section>
    </div>
  );
}
