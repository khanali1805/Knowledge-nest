"use client";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Edit3, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { readApiResponse } from "@/lib/http/read-api-response";
export type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
};
type TaxonomyManagerProps = {
  type: "category" | "tag";
  initialItems: TaxonomyItem[];
};
type TaxonomyResponse = {
  category?: TaxonomyItem;
  tag?: TaxonomyItem;
  message?: string;
};
function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
export function TaxonomyManager({ type, initialItems }: TaxonomyManagerProps) {
  const [items, setItems] = useState<TaxonomyItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const singularLabel = type === "category" ? "Category" : "Tag";
  const pluralLabel = type === "category" ? "Categories" : "Tags";
  const endpoint = type === "category" ? "/api/admin/categories" : "/api/admin/tags";
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query),
    );
  }, [items, searchQuery]);
  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setEditingId(null);
  }
  function handleNameChange(value: string) {
    setName(value);
    if (editingId === null) {
      setSlug(createSlug(value));
    }
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = createSlug(slug || name);
    const cleanDescription = description.trim();
    if (!cleanName || !cleanSlug) {
      setError(`${singularLabel} name and slug are required.`);
      return;
    }
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(
        editingId === null ? endpoint : `${endpoint}/${editingId}`,
        {
          method: editingId === null ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanName,
            slug: cleanSlug,
            description: cleanDescription,
          }),
        },
      );
      const responseData = await readApiResponse<TaxonomyResponse>(response);
      if (!response.ok) {
        throw new Error(responseData.message || `Unable to save ${type}.`);
      }
      const savedItem = type === "category" ? responseData.category : responseData.tag;
      if (!savedItem) {
        throw new Error(`The saved ${type} was not returned.`);
      }
      setItems((currentItems) => {
        if (editingId === null) {
          return [...currentItems, savedItem].sort((first, second) =>
            first.name.localeCompare(second.name),
          );
        }
        return currentItems
          .map((item) => (item.id === editingId ? savedItem : item))
          .sort((first, second) => first.name.localeCompare(second.name));
      });
      setMessage(responseData.message || `${singularLabel} saved successfully.`);
      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : `Unable to save ${type}.`,
      );
    } finally {
      setIsSaving(false);
    }
  }
  function handleEdit(item: TaxonomyItem) {
    setEditingId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setMessage("");
    setError("");
  }
  async function handleDelete(item: TaxonomyItem) {
    if (item.articleCount > 0) {
      return;
    }
    const confirmed = window.confirm(`Delete "${item.name}" permanently?`);
    if (!confirmed) {
      return;
    }
    setDeletingId(item.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${endpoint}/${item.id}`, {
        method: "DELETE",
      });
      const responseData = await readApiResponse<TaxonomyResponse>(response);
      if (!response.ok) {
        throw new Error(responseData.message || `Unable to delete ${type}.`);
      }
      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id),
      );
      if (editingId === item.id) {
        resetForm();
      }
      setMessage(responseData.message || `${singularLabel} deleted successfully.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : `Unable to delete ${type}.`,
      );
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="border-border bg-background h-fit rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId === null ? `Add ${singularLabel}` : `Edit ${singularLabel}`}
            </h2>
            {editingId !== null ? (
              <button
                type="button"
                onClick={resetForm}
                aria-label="Cancel editing"
                disabled={isSaving}
                className="border-border hover:bg-muted rounded-lg border p-2 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div>
              <label htmlFor={`${type}-name`} className="mb-2 block text-sm font-medium">
                Name
              </label>
              <input
                id={`${type}-name`}
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder={`${singularLabel} name`}
                required
                disabled={isSaving}
                className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor={`${type}-slug`} className="mb-2 block text-sm font-medium">
                Slug
              </label>
              <input
                id={`${type}-slug`}
                value={slug}
                onChange={(event) => setSlug(createSlug(event.target.value))}
                placeholder={`${type}-slug`}
                required
                disabled={isSaving}
                className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor={`${type}-description`}
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id={`${type}-description`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={`Optional ${type} description`}
                rows={4}
                maxLength={500}
                disabled={isSaving}
                className="border-border bg-background focus:ring-foreground/20 w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 disabled:opacity-50"
              />
              <p className="text-muted-foreground mt-2 text-right text-xs">
                {description.length}/500
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-foreground text-background inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : editingId === null ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Edit3 className="h-4 w-4" />
              )}
              {editingId === null ? `Add ${singularLabel}` : `Update ${singularLabel}`}
            </button>
          </form>
        </section>
        <section className="border-border bg-background overflow-hidden rounded-xl border shadow-sm">
          <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{pluralLabel}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {items.length} {items.length === 1 ? singularLabel : pluralLabel}
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Search ${pluralLabel.toLowerCase()}`}
                className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border py-2.5 pr-3 pl-10 text-sm outline-none focus:ring-4"
              />
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <div className="text-muted-foreground p-10 text-center text-sm">
              No {pluralLabel.toLowerCase()} found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Slug</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 text-center font-medium">Articles</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-5 py-4 font-medium">{item.name}</td>
                      <td className="text-muted-foreground px-5 py-4">{item.slug}</td>
                      <td className="text-muted-foreground max-w-xs px-5 py-4">
                        <p className="line-clamp-2">
                          {item.description || "No description"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center">{item.articleCount}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            disabled={isSaving || deletingId !== null}
                            className="border-border hover:bg-muted rounded-lg border p-2 transition-colors disabled:opacity-40"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            aria-label={`Delete ${item.name}`}
                            disabled={
                              item.articleCount > 0 || isSaving || deletingId !== null
                            }
                            className="border-border text-destructive hover:bg-muted rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === item.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
