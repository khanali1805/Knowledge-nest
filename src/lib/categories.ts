export const MASTER_CATEGORIES = [
  {
    id: "general-knowledge",
    name: "General Knowledge",
    slug: "general-knowledge",
    description:
      "Informative articles covering useful facts, ideas, discoveries and general learning.",
  },
  {
    id: "news",
    name: "News",
    slug: "news",
    description: "Latest reports, important developments and current affairs.",
  },
  {
    id: "finance",
    name: "Finance",
    slug: "finance",
    description: "Personal finance, markets, investment, banking and economic insights.",
  },
  {
    id: "technology",
    name: "Technology",
    slug: "technology",
    description: "Technology news, digital products, software, devices and innovation.",
  },
  {
    id: "artificial-intelligence",
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description:
      "Artificial intelligence, machine learning, automation and emerging AI tools.",
  },
  {
    id: "business",
    name: "Business",
    slug: "business",
    description:
      "Business strategy, entrepreneurship, management and professional growth.",
  },
  {
    id: "education",
    name: "Education",
    slug: "education",
    description:
      "Learning resources, academic guidance, skills and educational developments.",
  },
  {
    id: "health",
    name: "Health",
    slug: "health",
    description: "Health information, wellbeing, fitness and healthy lifestyle guidance.",
  },
  {
    id: "science",
    name: "Science",
    slug: "science",
    description: "Scientific discoveries, research, nature, space and exploration.",
  },
  {
    id: "fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Fashion trends, clothing, style inspiration and industry updates.",
  },
  {
    id: "beauty",
    name: "Beauty",
    slug: "beauty",
    description: "Beauty trends, skincare, cosmetics, grooming and personal care.",
  },
  {
    id: "cars",
    name: "Cars",
    slug: "cars",
    description: "Cars, automotive technology, reviews, maintenance and industry news.",
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    description: "Sports news, events, players, teams and performance analysis.",
  },
  {
    id: "travel",
    name: "Travel",
    slug: "travel",
    description:
      "Destinations, travel planning, experiences and practical travel guides.",
  },
  {
    id: "food",
    name: "Food",
    slug: "food",
    description: "Recipes, food culture, restaurants, nutrition and cooking inspiration.",
  },
  {
    id: "gaming",
    name: "Gaming",
    slug: "gaming",
    description: "Video games, gaming news, reviews, guides and industry developments.",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    slug: "entertainment",
    description: "Movies, television, celebrities, streaming and popular culture.",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    slug: "real-estate",
    description: "Property markets, buying, selling, renting and real-estate investment.",
  },
  {
    id: "agriculture",
    name: "Agriculture",
    slug: "agriculture",
    description:
      "Farming, crops, livestock, agricultural technology and rural development.",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    description:
      "Modern living, productivity, relationships, home and personal development.",
  },
] as const;
export type MasterCategory = (typeof MASTER_CATEGORIES)[number];
export type MasterCategoryId = MasterCategory["id"];
export type MasterCategorySlug = MasterCategory["slug"];
export type MasterCategoryName = MasterCategory["name"];
export const DEFAULT_CATEGORY_SLUG: MasterCategorySlug = "general-knowledge";
export const MASTER_CATEGORY_SLUGS = MASTER_CATEGORIES.map((category) => category.slug);
export const MASTER_CATEGORY_NAMES = MASTER_CATEGORIES.map((category) => category.name);
const CATEGORY_BY_SLUG = new Map<MasterCategorySlug, MasterCategory>(
  MASTER_CATEGORIES.map((category) => [category.slug, category]),
);
const CATEGORY_BY_NAME = new Map<string, MasterCategory>(
  MASTER_CATEGORIES.map((category) => [category.name.toLowerCase(), category]),
);
const LEGACY_CATEGORY_SLUGS: Readonly<Record<string, MasterCategorySlug>> = {
  general: "general-knowledge",
  "general-blog": "general-knowledge",
  general_blog: "general-knowledge",
  "general knowledge": "general-knowledge",
  general_knowledge: "general-knowledge",
  ai: "artificial-intelligence",
  "artificial intelligence": "artificial-intelligence",
  artificial_intelligence: "artificial-intelligence",
  automobile: "cars",
  automobiles: "cars",
  automotive: "cars",
  car: "cars",
  property: "real-estate",
  properties: "real-estate",
  realestate: "real-estate",
  real_estate: "real-estate",
};
const LEGACY_CATEGORY_NAMES: Readonly<Record<string, MasterCategorySlug>> = {
  general: "general-knowledge",
  "general blog": "general-knowledge",
  "general knowledge": "general-knowledge",
  ai: "artificial-intelligence",
  "artificial intelligence": "artificial-intelligence",
  automobile: "cars",
  automobiles: "cars",
  automotive: "cars",
  car: "cars",
  property: "real-estate",
  properties: "real-estate",
  "real estate": "real-estate",
};
function normaliseCategoryValue(value: string): string {
  return value.trim().toLowerCase();
}
function normaliseCategorySlugCandidate(value: string): string {
  return normaliseCategoryValue(value)
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
export function isMasterCategorySlug(value: unknown): value is MasterCategorySlug {
  return typeof value === "string" && CATEGORY_BY_SLUG.has(value as MasterCategorySlug);
}
export function getMasterCategoryBySlug(
  slug: string | null | undefined,
): MasterCategory | undefined {
  if (!slug) {
    return undefined;
  }
  const normalisedValue = normaliseCategoryValue(slug);
  const normalisedSlug = normaliseCategorySlugCandidate(slug);
  if (isMasterCategorySlug(normalisedSlug)) {
    return CATEGORY_BY_SLUG.get(normalisedSlug);
  }
  const migratedSlug =
    LEGACY_CATEGORY_SLUGS[normalisedValue] ?? LEGACY_CATEGORY_SLUGS[normalisedSlug];
  return migratedSlug ? CATEGORY_BY_SLUG.get(migratedSlug) : undefined;
}
export function getMasterCategoryByName(
  name: string | null | undefined,
): MasterCategory | undefined {
  if (!name) {
    return undefined;
  }
  const normalisedName = normaliseCategoryValue(name);
  const category = CATEGORY_BY_NAME.get(normalisedName);
  if (category) {
    return category;
  }
  const migratedSlug = LEGACY_CATEGORY_NAMES[normalisedName];
  return migratedSlug ? CATEGORY_BY_SLUG.get(migratedSlug) : undefined;
}
export function resolveMasterCategory(
  value: string | null | undefined,
): MasterCategory | undefined {
  return getMasterCategoryBySlug(value) ?? getMasterCategoryByName(value);
}
export function requireMasterCategory(value: string | null | undefined): MasterCategory {
  const category = resolveMasterCategory(value);
  if (!category) {
    throw new Error("A valid master category is required.");
  }
  return category;
}
export function getDefaultMasterCategory(): MasterCategory {
  return requireMasterCategory(DEFAULT_CATEGORY_SLUG);
}
export function normaliseMasterCategorySlug(
  value: string | null | undefined,
): MasterCategorySlug {
  return requireMasterCategory(value).slug;
}
export function getMasterCategoryOptions(): ReadonlyArray<{
  value: MasterCategorySlug;
  label: MasterCategoryName;
}> {
  return MASTER_CATEGORIES.map((category) => ({
    value: category.slug,
    label: category.name,
  }));
}
export function getMasterCategoryLabel(
  value: string | null | undefined,
): MasterCategoryName {
  return resolveMasterCategory(value)?.name ?? getDefaultMasterCategory().name;
}
export function getMasterCategoryDescription(value: string | null | undefined): string {
  return (
    resolveMasterCategory(value)?.description ?? getDefaultMasterCategory().description
  );
}
export function getMasterCategoryRecord(): Readonly<
  Record<MasterCategorySlug, MasterCategory>
> {
  return Object.fromEntries(
    MASTER_CATEGORIES.map((category) => [category.slug, category]),
  ) as Record<MasterCategorySlug, MasterCategory>;
}
