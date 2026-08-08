"use client";
import { usePathname } from "next/navigation";
import {
  Bell,
  Code2,
  ExternalLink,
  Files,
  FileText,
  FolderOpen,
  Image,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Tags,
  X,
} from "lucide-react";
import Link from "next/link";
type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};
type AdminSidebarProps = {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};
const navigation: NavigationItem[] = [
  {
    href: "/admin/design-code",
    label: "Design Studio",
    description: "Validate, preview and activate website designs",
    icon: Code2,
  },
  {
    href: "/admin",
    label: "Dashboard",
    description: "Overview and activity",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/articles",
    label: "Articles",
    description: "Create and manage content",
    icon: FileText,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Organize your articles",
    icon: FolderOpen,
  },
  {
    href: "/admin/tags",
    label: "Tags",
    description: "Manage article tags",
    icon: Tags,
  },
  {
    href: "/admin/media",
    label: "Media",
    description: "Images and uploaded files",
    icon: Image,
  },
  {
    href: "/admin/pages",
    label: "Pages",
    description: "Manage website pages",
    icon: Files,
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    description: "Alerts and audit retention",
    icon: Bell,
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
export function AdminSidebar({ isMobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      className={[
        "border-border bg-background fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <div className="border-border flex h-16 items-center justify-between border-b px-5 lg:h-[72px]">
        <Link href="/admin" className="group min-w-0" onClick={onMobileClose}>
          <div className="flex items-center gap-3">
            <span className="bg-foreground text-background inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-sm">
              KN
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight">
                Knowledge Nest
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                Administration
              </span>
            </span>
          </div>
        </Link>
        <button
          type="button"
          aria-label="Close admin navigation"
          className="border-border hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors lg:hidden"
          onClick={onMobileClose}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="text-muted-foreground mb-2 px-3 text-[11px] font-bold tracking-[0.16em] uppercase">
          Workspace
        </p>
        <nav aria-label="Admin navigation" className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isNavigationItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all",
                  isActive
                    ? "border-border bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground border-transparent",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
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
                      "block truncate text-xs",
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
      </div>
      <div className="border-border border-t p-3">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors"
          onClick={onMobileClose}
        >
          <span>View public website</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
export default AdminSidebar;
