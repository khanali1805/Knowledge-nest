"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
type AdminShellProps = Readonly<{
  children: ReactNode;
}>;
export function AdminShell({ children }: AdminShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  useEffect(() => {
    if (!isNavigationOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNavigationOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isNavigationOpen]);
  return (
    <div className="admin-surface min-h-screen">
      <div className="flex min-h-screen">
        <AdminSidebar />
        {isNavigationOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setIsNavigationOpen(false)}
            />
            <div className="relative h-full w-[min(19rem,88vw)]">
              <AdminSidebar
                mobile
                onNavigate={() => setIsNavigationOpen(false)}
                onClose={() => setIsNavigationOpen(false)}
              />
            </div>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <AdminHeader onOpenNavigation={() => setIsNavigationOpen(true)} />
          <main className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
