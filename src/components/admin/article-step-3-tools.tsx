"use client";

import { prepareImageForUpload, readJsonResponse } from "@/lib/client-image-upload";
import {
  Check,
  Clock3,
  Eye,
  FileImage,
  History,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MediaPicker } from "@/components/admin/media-picker";
export type ArticleStep3Snapshot = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  status: string;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  tags: string;
  featuredImageId: string;
};
type RevisionRecord = {
  id: string;
  createdAt: string;
  reason: "autosave" | "manual";
  snapshot: ArticleStep3Snapshot;
};
type UploadedMedia = {
  id?: string;
  url?: string;
  name?: string;
  originalName?: string;
  altText?: string | null;
};
type UploadResponse = {
  file?: UploadedMedia;
  media?: UploadedMedia;
  message?: string;
};
type LibraryMedia = {
  id: string;
  name: string;
  url: string;
};
type ArticleStep3ToolsProps = {
  storageKey: string;
  snapshot: ArticleStep3Snapshot;
  onRestore: (snapshot: ArticleStep3Snapshot) => void;
  onInsertImage: (imageUrl: string, altText: string, mediaId?: string) => void;
  onFeaturedImageChange: (mediaId: string) => void;
};
const AUTOSAVE_INTERVAL_MS = 15000;
const MAX_REVISIONS = 20;
function createRevisionId(): string {
  return [Date.now().toString(36), Math.random().toString(36).slice(2, 10)].join("-");
}
function readStoredRevisions(storageKey: string): RevisionRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return [];
    }
    const parsedValue = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }
    return parsedValue.filter(
      (item): item is RevisionRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as RevisionRecord).id === "string" &&
        typeof (item as RevisionRecord).createdAt === "string" &&
        typeof (item as RevisionRecord).snapshot === "object",
    );
  } catch {
    return [];
  }
}
function writeStoredRevisions(storageKey: string, revisions: RevisionRecord[]): void {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(revisions.slice(0, MAX_REVISIONS)),
  );
}
function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
export function ArticleStep3Tools({
  storageKey,
  snapshot,
  onRestore,
  onInsertImage,
  onFeaturedImageChange,
}: ArticleStep3ToolsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSnapshotRef = useRef<string>("");
  const [revisions, setRevisions] = useState<RevisionRecord[]>(() =>
    readStoredRevisions(storageKey),
  );
  const [lastSavedAt, setLastSavedAt] = useState<string>(() => {
    const storedRevisions = readStoredRevisions(storageKey);
    return storedRevisions[0]?.createdAt ?? "";
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const serialisedSnapshot = useMemo(() => JSON.stringify(snapshot), [snapshot]);
  const previewTitle = snapshot.title.trim() || "Untitled Article";
  const previewExcerpt = snapshot.excerpt.trim();
  useEffect(() => {
    const revisions = readStoredRevisions(storageKey);
    lastSnapshotRef.current = revisions[0] ? JSON.stringify(revisions[0].snapshot) : "";
  }, [storageKey]);
  const saveRevision = useCallback(
    (reason: "autosave" | "manual", showMessage: boolean) => {
      if (reason === "autosave" && serialisedSnapshot === lastSnapshotRef.current) {
        return;
      }
      const revision: RevisionRecord = {
        id: createRevisionId(),
        createdAt: new Date().toISOString(),
        reason,
        snapshot,
      };
      setRevisions((currentRevisions) => {
        const nextRevisions = [revision, ...currentRevisions].slice(0, MAX_REVISIONS);
        writeStoredRevisions(storageKey, nextRevisions);
        return nextRevisions;
      });
      lastSnapshotRef.current = serialisedSnapshot;
      setLastSavedAt(revision.createdAt);
      if (showMessage) {
        setMessage("Local revision save ho gayi.");
        setError("");
      }
    },
    [serialisedSnapshot, setLastSavedAt, setRevisions, snapshot, storageKey],
  );
  useEffect(() => {
    const timer = window.setInterval(() => {
      saveRevision("autosave", false);
    }, AUTOSAVE_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [saveRevision]);
  useEffect(() => {
    function handleBeforeUnload() {
      if (serialisedSnapshot !== lastSnapshotRef.current) {
        const revision: RevisionRecord = {
          id: createRevisionId(),
          createdAt: new Date().toISOString(),
          reason: "autosave",
          snapshot,
        };
        const currentRevisions = readStoredRevisions(storageKey);
        writeStoredRevisions(storageKey, [revision, ...currentRevisions]);
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [serialisedSnapshot, snapshot, storageKey]);
  function restoreRevision(revision: RevisionRecord) {
    onRestore(revision.snapshot);
    lastSnapshotRef.current = JSON.stringify(revision.snapshot);
    setMessage("Selected revision restore ho gayi.");
    setError("");
    setIsHistoryOpen(false);
  }
  function deleteRevision(revisionId: string) {
    setRevisions((currentRevisions) => {
      const nextRevisions = currentRevisions.filter(
        (revision) => revision.id !== revisionId,
      );
      writeStoredRevisions(storageKey, nextRevisions);
      return nextRevisions;
    });
  }
  function clearRevisionHistory() {
    window.localStorage.removeItem(storageKey);
    setRevisions([]);
    setLastSavedAt("");
    lastSnapshotRef.current = "";
    setMessage("Local revision history clear ho gayi.");
  }
  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      setError("Sirf valid image file upload karein.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size 10 MB ya us se kam honi chahiye.");
      return;
    }
    setIsUploading(true);
    setMessage("");
    setError("");
    try {
      const preparedFile = await prepareImageForUpload(selectedFile);
      const formData = new FormData();
      formData.append("file", preparedFile.file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await readJsonResponse(response)) as UploadResponse;
      if (!response.ok) {
        throw new Error(result.message ?? "Image upload nahi hui.");
      }
      const uploadedMedia = result.file ?? result.media;
      const imageUrl = uploadedMedia?.url?.trim();
      if (!imageUrl) {
        throw new Error("Upload response mein image URL missing hai.");
      }
      const mediaId = uploadedMedia?.id?.trim();
      const defaultAltText =
        uploadedMedia?.altText?.trim() ||
        uploadedMedia?.originalName?.trim() ||
        uploadedMedia?.name?.trim() ||
        selectedFile.name;
      const altText =
        window.prompt("Image alt text enter karein:", defaultAltText)?.trim() ??
        defaultAltText;
      const imageAction = window.confirm(
        "OK press karne par image article content mein insert hogi. Cancel press karne par featured image set hogi.",
      );
      if (imageAction) {
        onInsertImage(imageUrl, altText, mediaId);
        setMessage("Image article content mein insert ho gayi.");
      } else if (mediaId) {
        onFeaturedImageChange(mediaId);
        setMessage("Featured image select ho gayi.");
      } else {
        onInsertImage(imageUrl, altText);
        setMessage(
          "Media ID available nahi thi, image article content mein insert kar di gayi.",
        );
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Image upload nahi hui.",
      );
    } finally {
      setIsUploading(false);
    }
  }
  function useLibraryImage(media: LibraryMedia) {
    const defaultAltText = media.name.trim() || snapshot.title.trim() || "Article image";
    const altText =
      window.prompt("Image alt text enter karein:", defaultAltText)?.trim() ??
      defaultAltText;
    const insertIntoContent = window.confirm(
      "OK press karne par image article content mein insert hogi aur homepage featured image bhi update hogi. Cancel press karne par sirf featured image set hogi.",
    );
    if (insertIntoContent) {
      onInsertImage(media.url, altText, media.id);
      setMessage(
        "Media Library image article mein insert aur featured image ke tor par select ho gayi.",
      );
    } else {
      onFeaturedImageChange(media.id);
      setMessage("Media Library image featured image ke tor par select ho gayi.");
    }
    setError("");
  }
  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Step 3 Writing Tools</h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Autosave har 15 seconds</span>
              {lastSavedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  Last saved {new Date(lastSavedAt).toLocaleTimeString()}
                </span>
              ) : (
                <span>Abhi koi local revision nahi</span>
              )}
              <span>{revisions.length} revisions</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveRevision("manual", true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Save className="h-4 w-4" />
              Save Revision
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <History className="h-4 w-4" />
              Revision History
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => setIsMediaLibraryOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <FileImage className="h-4 w-4" />
              Media Library
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => void uploadImage(event)}
              className="hidden"
            />
          </div>
        </div>
        {message ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <Check className="h-4 w-4" />
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <X className="h-4 w-4" />
            {error}
          </div>
        ) : null}
      </section>
      <MediaPicker
        open={isMediaLibraryOpen}
        selectedUrl=""
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={useLibraryImage}
      />
      {isHistoryOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Article revision history"
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-950">Revision History</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Local browser revisions: {revisions.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Close revision history"
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">
              {revisions.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center text-slate-500">
                  <History className="h-10 w-10" />
                  <p className="mt-3 text-sm">Koi revision available nahi hai.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {revisions.map((revision) => (
                    <article
                      key={revision.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {revision.snapshot.title || "Untitled Article"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(revision.createdAt).toLocaleString()} ·{" "}
                            {revision.reason === "manual"
                              ? "Manual revision"
                              : "Autosave"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => restoreRevision(revision)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRevision(revision.id)}
                            aria-label="Delete revision"
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-slate-200 p-4">
              <button
                type="button"
                disabled={revisions.length === 0}
                onClick={clearRevisionHistory}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isPreviewOpen ? (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Article live preview"
            className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-bold">Live Article Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Close preview"
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-8">
              <article className="mx-auto min-h-full max-w-4xl rounded-xl bg-white px-5 py-10 shadow-sm sm:px-10">
                <header className="border-b border-slate-200 pb-8">
                  <h1 className="text-3xl leading-tight font-black tracking-tight text-slate-950 sm:text-5xl">
                    {previewTitle}
                  </h1>
                  {previewExcerpt ? (
                    <p className="mt-5 text-lg leading-8 text-slate-600">
                      {previewExcerpt}
                    </p>
                  ) : null}
                </header>
                <div
                  className="published-article-content mt-8"
                  dangerouslySetInnerHTML={{
                    __html:
                      snapshot.content ||
                      `<p>${escapeAttribute(
                        previewExcerpt || "Article preview content yahan nazar aayega.",
                      )}</p>`,
                  }}
                />
              </article>
            </div>
          </div>
        </div>
      ) : null}
      <div className="hidden">
        <Upload />
        <FileImage />
      </div>
    </>
  );
}
