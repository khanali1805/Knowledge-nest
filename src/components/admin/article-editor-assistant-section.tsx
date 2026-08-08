"use client";
import { AIContentAssistantPanel } from "@/components/admin/ai-content-assistant-panel";
type AssistantResult = {
  title: string;
  content: string;
  suggestions: string[];
};
type ArticleAssistantSectionProps = {
  title: string;
  content: string;
  onAssistantUpdate: (result: AssistantResult) => void;
};
export function ArticleEditorAssistantSection({
  title,
  content,
  onAssistantUpdate,
}: ArticleAssistantSectionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <AIContentAssistantPanel
        title={title}
        content={content}
        onUpdated={onAssistantUpdate}
      />
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
          Smart Editor
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">
          AI Editing Workflow Ready
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          AI rewrite, improvement, expansion and simplification tools are connected.
        </p>
      </section>
    </div>
  );
}
