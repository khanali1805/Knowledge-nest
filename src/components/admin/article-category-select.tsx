"use client";
import { MasterCategorySelect } from "@/components/admin/master-category-select";
import type { MasterCategorySlug } from "@/lib/categories";
type ArticleCategorySelectProps = {
  value: string;
  onChange: (value: MasterCategorySlug) => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
};
export function ArticleCategorySelect({
  value,
  onChange,
  disabled = false,
  error,
  className = "",
}: ArticleCategorySelectProps) {
  return (
    <MasterCategorySelect
      id="article-category"
      name="category"
      label="Article Category"
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      className={className}
      required
    />
  );
}
