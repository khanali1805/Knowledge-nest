"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Files,
  FolderOpen,
  Image,
  LayoutDashboard,
  Palette,
  Settings,
  Tags,
  X,
  type LucideIcon,
} from "lucide-react";
type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};
type AdminSidebarProps = Readonly<{
  mobile?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}>;
const navigation: NavigationItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Workspace overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/articles",
    label: "Articles",
    description: "Write and publish",
    icon: FileText,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Organise content",
    icon: FolderOpen,
  },
  {
    href: "/admin/tags",
    label: "Tags",
    description: "Manage taxonomy",
    icon: Tags,
  },
  {
    href: "/admin/media",
    label: "Media",
    description: "Images and uploads",
    icon: Image,
  },
  {
    href: "/admin/pages",
    label: "Pages",
    description: "Static information",
    icon: Files,
  },
  {
    href: "/admin/themes",
    label: "Theme Studio",
    description: "Design and preview",
    icon: Palette,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Website configuration",
    icon: Settings,
  },
];
function isNavigationItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
export function AdminSidebar({ mobile = false, onClose, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      aria-label="Administration sidebar"
      className={[
        "border-border bg-background shrink-0 border-r",
        mobile
          ? "relative z-10 block h-full w-full shadow-2xl"
          : "hidden min-h-screen w-72 lg:block",
      ].join(" ")}
    >
      <div
        className={
          mobile ? "flex h-full flex-col" : "sticky top-0 flex h-screen flex-col"
        }
      >
        <div className="border-border flex min-h-20 items-center justify-between gap-3 border-b px-5">
          <Link
            href="/admin"
            onClick={onNavigate}
            className="group min-w-0 rounded-lg focus-visible:outline-none"
          >
            <span className="block truncate text-lg font-black tracking-tight">
              Knowledge Nest
            </span>
            <span className="text-muted-foreground block text-xs">
              Administration workspace
            </span>
          </Link>
          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="border-border hover:bg-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1.5 overflow-y-auto p-3"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isNavigationItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-background/15" : "bg-muted group-hover:bg-background",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {item.label}
                  </span>
                  <span
                    className={[
                      "block truncate text-[11px]",
                      isActive ? "text-background/70" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-border border-t p-3">
          <Link
            href="/"
            onClick={onNavigate}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-semibold transition"
          >
            <span>View public website</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
export default AdminSidebar;
