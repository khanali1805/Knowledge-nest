"use client";
import { AIContentQualityPanel } from "@/components/admin/ai-content-quality-panel";
type QualityResult = {
  score: number;
  readabilityScore: number;
  structureScore: number;
  engagementScore: number;
  suggestions: string[];
};
type ArticleQualitySectionProps = {
  title: string;
  content: string;
  onQualityUpdate: (result: QualityResult) => void;
};
export function ArticleEditorQualitySection({
  title,
  content,
  onQualityUpdate,
}: ArticleQualitySectionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <AIContentQualityPanel
        title={title}
        content={content}
        onAnalyzed={onQualityUpdate}
      />
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
          Quality Assistant
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">Content Quality Review</h2>
        <p className="mt-3 text-sm text-slate-600">
          AI quality recommendations will appear after analysis.
        </p>
      </section>
    </div>
  );
}
