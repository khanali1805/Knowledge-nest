import type { Metadata } from "next";
import { DesignCodeWorkspace } from "@/components/admin/design-code-workspace";
import { readDesignCodeStore } from "@/lib/design-code/store";
export const metadata: Metadata = {
  title: "Design Studio",
};
export const dynamic = "force-dynamic";
export default async function DesignStudioPage() {
  const initialStore = await readDesignCodeStore();
  return <DesignCodeWorkspace initialStore={initialStore} />;
}
