export type UtilityStatus = "live" | "planned";
export type UtilityDefinition = {
  categorySlug: string;
  categoryName: string;
  utilitySlug: string;
  title: string;
  shortTitle: string;
  description: string;
  status: UtilityStatus;
  href: string | null;
};
export const UTILITY_CATALOG: readonly UtilityDefinition[] = [
  {
    categorySlug: "beauty-skincare",
    categoryName: "Beauty & Skincare",
    utilitySlug: "beauty-skincare-routine-builder",
    title: "Beauty & Skincare Routine Builder",
    shortTitle: "Routine Builder",
    description:
      "Build a practical skincare and beauty routine around your goals, routine steps, and schedule.",
    status: "live",
    href: "/tools/beauty-skincare-routine-builder",
  },
  {
    categorySlug: "food-recipes",
    categoryName: "Food & Recipes",
    utilitySlug: "recipe-serving-meal-planner",
    title: "Recipe Serving & Meal Planner",
    shortTitle: "Meal Planner",
    description:
      "Scale recipe servings and organize meal quantities, ingredients, and preparation.",
    status: "live",
    href: "/tools/recipe-serving-meal-planner",
  },
  {
    categorySlug: "health-fitness-wellness",
    categoryName: "Health, Fitness & Wellness",
    utilitySlug: "wellness-fitness-planner",
    title: "Wellness & Fitness Planner",
    shortTitle: "Wellness Planner",
    description:
      "Plan general activity, hydration habits, workouts, and wellness routines without diagnosis.",
    status: "live",
    href: "/tools/wellness-fitness-planner",
  },
  {
    categorySlug: "home-dcor-organization",
    categoryName: "Home Decor & Organization",
    utilitySlug: "home-organization-planner",
    title: "Home Organization Planner",
    shortTitle: "Home Planner",
    description:
      "Plan room organization, decluttering, storage priorities, and home projects.",
    status: "live",
    href: "/tools/home-organization-planner",
  },
  {
    categorySlug: "money-career",
    categoryName: "Money & Career",
    utilitySlug: "money-career-goal-planner",
    title: "Money & Career Goal Planner",
    shortTitle: "Goal Planner",
    description:
      "Organize budgets, savings goals, career milestones, applications, and measurable action plans.",
    status: "live",
    href: "/tools/money-career-goal-planner",
  },
  {
    categorySlug: "relationships-family",
    categoryName: "Relationships & Family",
    utilitySlug: "relationships-family-planner",
    title: "Relationships & Family Planner",
    shortTitle: "Family Planner",
    description:
      "Build practical schedules, shared plans, checklists, and family workflows without diagnosis or therapy claims.",
    status: "live",
    href: "/tools/relationships-family-planner",
  },
  {
    categorySlug: "travel-lifestyle",
    categoryName: "Travel & Lifestyle",
    utilitySlug: "travel-trip-budget-planner",
    title: "Travel Trip Budget Planner",
    shortTitle: "Trip Budget Planner",
    description:
      "Estimate accommodation, food, transport, activities, extras, and a contingency buffer for a trip.",
    status: "live",
    href: "/tools/travel-trip-budget-planner",
  },
  {
    categorySlug: "womens-fashion-style",
    categoryName: "Women's Fashion & Style",
    utilitySlug: "fashion-style-outfit-planner",
    title: "Fashion & Style Outfit Planner",
    shortTitle: "Outfit Planner",
    description:
      "Plan outfits, wardrobe combinations, occasions, style priorities, and reusable looks.",
    status: "live",
    href: "/tools/fashion-style-outfit-planner",
  },
] as const;
function normalizeCategorySlug(value: string): string {
  return value.trim().toLowerCase();
}
export function getLiveUtilities(): UtilityDefinition[] {
  return UTILITY_CATALOG.filter(
    (utility) => utility.status === "live" && Boolean(utility.href),
  );
}
export function getPlannedUtilities(): UtilityDefinition[] {
  return UTILITY_CATALOG.filter((utility) => utility.status === "planned");
}
export function getUtilityBySlug(utilitySlug: string): UtilityDefinition | undefined {
  return UTILITY_CATALOG.find((utility) => utility.utilitySlug === utilitySlug);
}
export function getUtilitiesForCategory(
  categorySlug: string | null | undefined,
): UtilityDefinition[] {
  if (!categorySlug) {
    return [];
  }
  const normalized = normalizeCategorySlug(categorySlug);
  return UTILITY_CATALOG.filter(
    (utility) => normalizeCategorySlug(utility.categorySlug) === normalized,
  );
}
export function getLiveUtilitiesForCategory(
  categorySlug: string | null | undefined,
): UtilityDefinition[] {
  return getUtilitiesForCategory(categorySlug).filter(
    (utility) => utility.status === "live" && Boolean(utility.href),
  );
}
