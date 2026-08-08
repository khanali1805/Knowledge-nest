"use client";
import { type ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
type AdminShellProps = {
  children: ReactNode;
};
export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const isAdminLoginPage = pathname === "/admin/login";
  function openNavigation() {
    setIsNavigationOpen(true);
  }
  function closeNavigation() {
    setIsNavigationOpen(false);
  }
  if (isAdminLoginPage) {
    return <>{children}</>;
  }
  return (
    <div className="bg-muted/20 min-h-screen">
      <AdminSidebar isMobileOpen={isNavigationOpen} onMobileClose={closeNavigation} />
      {isNavigationOpen ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeNavigation}
        />
      ) : null}
      <div className="min-w-0 lg:pl-72">
        <AdminHeader onOpenNavigation={openNavigation} />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
