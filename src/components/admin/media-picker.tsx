/* eslint-disable @next/next/no-img-element -- Existing dynamic CMS media requires native image rendering. */

/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaRecord } from "@/lib/media-store";
import { prepareImageForUpload, readJsonResponse } from "@/lib/client-image-upload";
type MediaPickerProps = {
  open: boolean;
  selectedUrl: string;
  onClose: () => void;
  onSelect: (media: MediaRecord) => void;
};
type MediaListResponse = {
  success: boolean;
  media?: MediaRecord[];
  message?: string;
};
type MediaUploadResponse = {
  success: boolean;
  media?: MediaRecord;
  message?: string;
};
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export function MediaPicker({ open, selectedUrl, onClose, onSelect }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMedia = useCallback(
    async (searchValue = "") => {
      setIsLoading(true);
      setMessage("");
      try {
        const query = new URLSearchParams();
        if (searchValue.trim()) {
          query.set("search", searchValue.trim());
        }
        const response = await fetch(
          `/api/admin/media${query.toString() ? `?${query.toString()}` : ""}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const result = await readJsonResponse<MediaListResponse>(response);
        if (!response.ok || !result.success) {
          setMessage(result.message || "Unable to load media.");
          return;
        }
        const nextMedia = result.media ?? [];
        setMedia(nextMedia);
        if (selectedUrl) {
          const current = nextMedia.find((item) => item.url === selectedUrl);
          if (current) {
            setSelectedMedia(current);
          }
        }
      } catch {
        setMessage("Unable to load media.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedUrl],
  );
  useEffect(() => {
    if (!open) {
      return;
    }
    void loadMedia(search);
  }, [loadMedia, open, search]);
  useEffect(() => {
    if (!open) {
      setSearch("");
      setMessage("");
      setUploadProgress(0);
    }
  }, [open]);
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setMessage("");
    try {
      const preparedFile = await prepareImageForUpload(file);
      const formData = new FormData();
      formData.append("file", preparedFile);
      setUploadProgress(35);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      setUploadProgress(75);
      const result = await readJsonResponse<MediaUploadResponse>(response);
      if (!response.ok || !result.success || !result.media) {
        setMessage(result.message || "Unable to upload image.");
        return;
      }
      setUploadProgress(100);
      setMedia((current) => [
        result.media!,
        ...current.filter((item) => item.id !== result.media!.id),
      ]);
      setSelectedMedia(result.media);
      setMessage(result.message || "Image uploaded successfully.");
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error ? uploadError.message : "Unable to upload image.",
      );
    } finally {
      window.setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 350);
    }
  };
  if (!open) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Select featured image"
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">Media Library</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select an existing image or upload a new one.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900"
          >
            Close
          </button>
        </div>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 border-b border-slate-200 lg:border-r lg:border-b-0">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                placeholder="Search media"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadFile(file);
                  }
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
            {isUploading ? (
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-slate-950 transition-all"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  Upload progress: {uploadProgress}%
                </p>
              </div>
            ) : null}
            <div className="max-h-[56vh] overflow-y-auto p-5">
              {isLoading ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Loading media...
                </div>
              ) : media.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {media.map((item) => {
                    const active = selectedMedia?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedMedia(item)}
                        className={`overflow-hidden rounded-2xl border-2 text-left transition ${
                          active
                            ? "border-slate-950"
                            : "border-transparent hover:border-slate-300"
                        }`}
                      >
                        <img
                          decoding="async"
                          loading="lazy"
                          src={item.url}
                          alt={item.name}
                          className="aspect-square w-full object-cover"
                        />
                        <div className="p-3">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-sm font-semibold text-slate-700">No media found.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload an image without leaving the article editor.
                  </p>
                </div>
              )}
            </div>
          </div>
          <aside className="overflow-y-auto p-5">
            <h3 className="text-sm font-bold tracking-[0.16em] text-slate-500 uppercase">
              Selected Image
            </h3>
            {selectedMedia ? (
              <div className="mt-4">
                <img
                  decoding="async"
                  loading="lazy"
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="aspect-video w-full rounded-2xl object-cover"
                />
                <p className="mt-4 text-sm font-bold break-words text-slate-900">
                  {selectedMedia.name}
                </p>
                <p className="mt-2 text-xs text-slate-500">{selectedMedia.mimeType}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(selectedMedia.size)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(selectedMedia);
                    onClose();
                  }}
                  className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                >
                  Use Selected Image
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                Select an image to preview it.
              </div>
            )}
            {message ? (
              <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                {message}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
