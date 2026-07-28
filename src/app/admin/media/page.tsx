import { MediaLibrary } from "@/components/admin/media/media-library";
export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Media Library</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Upload, preview, copy and manage website images.
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
