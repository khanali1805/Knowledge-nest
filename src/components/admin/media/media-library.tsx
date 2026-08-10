"use client";
import Image from "next/image";
import {
  Check,
  Copy,
  FileImage,
  LoaderCircle,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  MAXIMUM_ORIGINAL_IMAGE_SIZE,
  prepareImageForUpload,
  readJsonResponse,
} from "@/lib/client-image-upload";
type MediaFile = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
};
type ApiResponse = {
  files?: MediaFile[];
  file?: MediaFile;
  message?: string;
};
function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
export function MediaLibrary() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function loadFiles() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/media", {
        cache: "no-store",
      });
      const responseData = await readJsonResponse<ApiResponse>(response);
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to load media files.");
      }
      setFiles(responseData.files ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load media files.",
      );
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    queueMicrotask(() => {
      void loadFiles();
    });
  }, []);
  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return files;
    }
    return files.filter((file) => file.name.toLowerCase().includes(query));
  }, [files, searchQuery]);
  async function uploadFile(file: File) {
    setMessage("");
    setError("");
    if (
      !ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])
    ) {
      setError("Only JPG, PNG and WebP images are allowed.");
      return;
    }
    if (file.size > MAXIMUM_ORIGINAL_IMAGE_SIZE) {
      setError("The selected image exceeds the 10 MB selection limit.");
      return;
    }
    setIsUploading(true);
    try {
      const preparedFile = await prepareImageForUpload(file);
      const formData = new FormData();
      formData.append("file", preparedFile.file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const responseData = await readJsonResponse<ApiResponse>(response);
      if (!response.ok || !responseData.file) {
        throw new Error(responseData.message || "Unable to upload the image.");
      }
      setFiles((currentFiles) => [responseData.file!, ...currentFiles]);
      setMessage("Image uploaded successfully.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the image.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }
  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(true);
  }
  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }
  async function copyFileUrl(file: MediaFile) {
    const absoluteUrl = new URL(file.url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedFileId(file.id);
      window.setTimeout(() => {
        setCopiedFileId(null);
      }, 2000);
    } catch {
      setError("Unable to copy the image URL.");
    }
  }
  async function removeFile(file: MediaFile) {
    const confirmed = window.confirm(
      `Delete "${file.name}" permanently from the media library?`,
    );
    if (!confirmed) {
      return;
    }
    setDeletingFileId(file.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/media/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: file.id,
        }),
      });
      const responseData = await readJsonResponse<ApiResponse>(response);
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to delete the image.");
      }
      setFiles((currentFiles) =>
        currentFiles.filter((currentFile) => currentFile.id !== file.id),
      );
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
      setMessage("Image deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the image.",
      );
    } finally {
      setDeletingFileId(null);
    }
  }
  return (
    <div className="space-y-6 sm:space-y-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-border bg-background rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${
          dragActive ? "bg-muted" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
        />
        <div className="mx-auto flex max-w-md flex-col items-center">
          {isUploading ? (
            <LoaderCircle className="text-muted-foreground h-10 w-10 animate-spin" />
          ) : (
            <Upload className="text-muted-foreground h-10 w-10" />
          )}
          <h2 className="mt-4 text-lg font-semibold">
            {isUploading ? "Uploading image" : "Upload Media"}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Drag and drop an image here or select one from your computer.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-foreground text-background mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Select Image
          </button>
          <p className="text-muted-foreground mt-3 text-xs">
            JPG, PNG or WebP. Images are optimized to 1600x900 before upload. Maximum
            selection size: 20 MB.
          </p>
        </div>
      </div>
      {message ? (
        <div className="border-border bg-background flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
          <Check className="h-4 w-4" />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
          <X className="h-4 w-4" />
          {error}
        </div>
      ) : null}
      <section className="border-border bg-background overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Media Files</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {files.length} {files.length === 1 ? "file" : "files"}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search media"
              className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border py-2.5 pr-3 pl-10 text-sm outline-none focus:ring-4"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <LoaderCircle className="text-muted-foreground h-7 w-7 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <FileImage className="h-10 w-10" />
            <p className="mt-3 text-sm">
              {searchQuery
                ? "No matching media files were found."
                : "No media files have been uploaded."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredFiles.map((file) => (
              <article
                key={file.id}
                className="border-border overflow-hidden rounded-xl border"
              >
                <button
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className="bg-muted relative block aspect-video w-full overflow-hidden"
                >
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
                <div className="p-4">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <div className="text-muted-foreground mt-2 flex items-center justify-between gap-3 text-xs">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyFileUrl(file)}
                      className="border-border hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                    >
                      {copiedFileId === file.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedFileId === file.id ? "Copied" : "Copy URL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFile(file)}
                      disabled={deletingFileId === file.id}
                      aria-label={`Delete ${file.name}`}
                      className="border-border text-destructive hover:bg-muted rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingFileId === file.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {selectedFile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Media preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-background max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl shadow-xl">
            <div className="border-border flex items-center justify-between border-b p-4">
              <p className="truncate pr-4 text-sm font-semibold">{selectedFile.name}</p>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                aria-label="Close media preview"
                className="border-border hover:bg-muted rounded-lg border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-muted relative min-h-[300px] sm:min-h-[500px]">
              <Image
                src={selectedFile.url}
                alt={selectedFile.name}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground text-xs">
                {formatFileSize(selectedFile.size)} · {selectedFile.type}
              </div>
              <button
                type="button"
                onClick={() => void copyFileUrl(selectedFile)}
                className="border-border hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
              >
                <Copy className="h-4 w-4" />
                Copy Image URL
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
