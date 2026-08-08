"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type AdminLogoutButtonProps = {
  className?: string;
};
export function AdminLogoutButton({ className }: AdminLogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={
        className ??
        "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}
