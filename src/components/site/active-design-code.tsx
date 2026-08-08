"use client";
import { usePathname } from "next/navigation";
type ActiveDesignCodeProps = {
  code: string;
};
export function ActiveDesignCode({ code }: ActiveDesignCodeProps) {
  const pathname = usePathname();
  if (!code || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }
  return <style id="knowledge-nest-active-design-code">{code}</style>;
}
