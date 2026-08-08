import { SiteHeaderClient } from "@/components/site/site-header-client";
import { getSiteShellLayout } from "@/lib/site-shell-runtime";
export async function SiteHeader() {
  const layout = await getSiteShellLayout();
  return <SiteHeaderClient layout={layout} />;
}
