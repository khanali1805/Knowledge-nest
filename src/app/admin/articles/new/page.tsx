import { ArticleAuthoringWorkspace } from "@/components/admin/article-authoring-workspace";
export default function NewArticlePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-[0.18em] text-slate-500 uppercase">
          Articles
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          New Article
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          AI Writer ya Manual Writer select karke professional article create karein.
        </p>
      </div>
      <ArticleAuthoringWorkspace />
    </main>
  );
}
