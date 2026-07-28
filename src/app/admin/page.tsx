import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Files,
  FolderTree,
  ImageIcon,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Tags,
} from "lucide-react";
const statistics = [
  {
    label: "Total Articles",
    value: "0",
    detail: "All drafts and published posts",
    icon: FileText,
  },
  {
    label: "Published",
    value: "0",
    detail: "Articles visible on the website",
    icon: Sparkles,
  },
  {
    label: "Categories",
    value: "0",
    detail: "Content organisation groups",
    icon: FolderTree,
  },
  {
    label: "Media Files",
    value: "0",
    detail: "Images and uploaded assets",
    icon: ImageIcon,
  },
];
const quickActions = [
  {
    label: "Create Article",
    description: "Start a new article draft",
    href: "/admin/articles/new",
    icon: Plus,
  },
  {
    label: "Manage Articles",
    description: "Edit and publish content",
    href: "/admin/articles",
    icon: FileText,
  },
  {
    label: "Theme Studio",
    description: "Customise the public website",
    href: "/admin/themes",
    icon: Palette,
  },
  {
    label: "Media Library",
    description: "Upload and manage images",
    href: "/admin/media",
    icon: ImageIcon,
  },
  {
    label: "Categories",
    description: "Organise article topics",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Tags",
    description: "Manage article labels",
    href: "/admin/tags",
    icon: Tags,
  },
  {
    label: "Pages",
    description: "Edit information pages",
    href: "/admin/pages",
    icon: Files,
  },
  {
    label: "Site Settings",
    description: "Configure website options",
    href: "/admin/settings",
    icon: Settings,
  },
];
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="border-border bg-background relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8">
        <div className="bg-foreground/5 pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Knowledge Nest Control Centre
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Manage your publishing workspace
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              Create articles, organise content, manage media and customise the active
              website theme from one responsive dashboard.
            </p>
          </div>
          <Link
            href="/admin/articles/new"
            className="bg-foreground text-background inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Create Article
          </Link>
        </div>
      </section>
      <section aria-labelledby="website-overview-heading">
        <div className="mb-4">
          <h2 id="website-overview-heading" className="text-lg font-bold">
            Website overview
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Current content and asset totals.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="border-border bg-background group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-black tracking-tight">
                      {item.value}
                    </p>
                  </div>
                  <span className="bg-muted group-hover:bg-foreground group-hover:text-background inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-muted-foreground mt-4 text-xs leading-5">
                  {item.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="quick-actions-heading">
        <div className="mb-4">
          <h2 id="quick-actions-heading" className="text-lg font-bold">
            Quick actions
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Open the most frequently used administration tools.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="border-border bg-background group flex min-h-32 flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="bg-muted group-hover:bg-foreground group-hover:text-background inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="mt-5">
                  <p className="text-sm font-bold">{action.label}</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Recent articles</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Recently created and updated content will appear here.
            </p>
          </div>
          <Link
            href="/admin/articles"
            className="border-border hover:bg-muted inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition"
          >
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="border-border bg-muted/30 text-muted-foreground mt-6 rounded-xl border border-dashed p-10 text-center">
          <FileText className="mx-auto h-9 w-9 opacity-50" />
          <p className="mt-3 text-sm font-semibold">No articles have been created</p>
          <p className="mt-1 text-xs">
            Create your first article to populate this section.
          </p>
          <Link
            href="/admin/articles/new"
            className="bg-foreground text-background mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create first article
          </Link>
        </div>
      </section>
    </div>
  );
}
