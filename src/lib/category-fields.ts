import {
  DEFAULT_CATEGORY_SLUG,
  MASTER_CATEGORIES,
  getMasterCategoryBySlug,
  resolveMasterCategory,
  type MasterCategory,
  type MasterCategorySlug,
} from "@/lib/categories";
export type CategoryReference = {
  category?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
};
export function resolveCategoryReference(
  reference: CategoryReference | null | undefined,
): MasterCategory {
  const category =
    resolveMasterCategory(reference?.categorySlug) ??
    resolveMasterCategory(reference?.categoryId) ??
    resolveMasterCategory(reference?.category) ??
    resolveMasterCategory(reference?.categoryName) ??
    getMasterCategoryBySlug(DEFAULT_CATEGORY_SLUG);
  if (!category) {
    throw new Error("The default master category is unavailable.");
  }
  return category;
}
export function createCanonicalCategoryFields(
  value: string | CategoryReference | null | undefined,
): {
  category: MasterCategorySlug;
  categoryId: MasterCategorySlug;
  categoryName: MasterCategory["name"];
  categorySlug: MasterCategorySlug;
} {
  const category =
    typeof value === "string"
      ? resolveMasterCategory(value)
      : resolveCategoryReference(value);
  if (!category) {
    throw new Error("A valid article category is required.");
  }
  return {
    category: category.slug,
    categoryId: category.slug,
    categoryName: category.name,
    categorySlug: category.slug,
  };
}
export function mergeCanonicalCategoryFields<T extends Record<string, unknown>>(
  record: T,
): T & ReturnType<typeof createCanonicalCategoryFields> {
  return {
    ...record,
    ...createCanonicalCategoryFields(record as CategoryReference),
  };
}
export function isCategoryMatch(
  first: CategoryReference | string | null | undefined,
  second: CategoryReference | string | null | undefined,
): boolean {
  const firstCategory =
    typeof first === "string"
      ? resolveMasterCategory(first)
      : resolveCategoryReference(first);
  const secondCategory =
    typeof second === "string"
      ? resolveMasterCategory(second)
      : resolveCategoryReference(second);
  if (!firstCategory || !secondCategory) {
    return false;
  }
  if (!firstCategory || !secondCategory) {
    return false;
  }
  return firstCategory.slug === secondCategory.slug;
}
export function getMasterCategorySelectItems(): ReadonlyArray<{
  id: MasterCategorySlug;
  name: MasterCategory["name"];
  slug: MasterCategorySlug;
}> {
  return MASTER_CATEGORIES.map((category) => ({
    id: category.slug,
    name: category.name,
    slug: category.slug,
  }));
}
