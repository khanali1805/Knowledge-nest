import { notFound } from "next/navigation";
import { z } from "zod";
import { PageEditor } from "@/components/admin/pages/page-editor";
type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    notFound();
  }
  return <PageEditor mode="edit" pageId={parsedId.data} />;
}
