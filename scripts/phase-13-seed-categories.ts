import { randomUUID } from "node:crypto";
import { asc } from "drizzle-orm";
import { db } from "../src/db";
import { categories } from "../src/db/schema";
const defaults = [
  {
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description:
      "Artificial intelligence, machine learning, automation and emerging AI tools.",
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Technology news, software, devices, digital platforms and innovation.",
  },
  {
    name: "Science",
    slug: "science",
    description: "Scientific discoveries, research, space, nature and practical science.",
  },
  {
    name: "Education",
    slug: "education",
    description:
      "Learning resources, academic guidance, skills and educational technology.",
  },
  {
    name: "Business",
    slug: "business",
    description: "Business strategy, entrepreneurship, leadership and industry insights.",
  },
  {
    name: "Finance",
    slug: "finance",
    description: "Personal finance, markets, banking, investment and financial literacy.",
  },
  {
    name: "Health",
    slug: "health",
    description:
      "Health knowledge, wellness, fitness and evidence-based lifestyle guidance.",
  },
  {
    name: "General Knowledge",
    slug: "general-knowledge",
    description: "Useful facts, explainers, history, culture and broad knowledge topics.",
  },
];
function createInsertValue(
  category: (typeof defaults)[number],
): typeof categories.$inferInsert {
  const tableColumns = categories as unknown as Record<string, unknown>;
  const now = new Date();
  const value: Record<string, unknown> = {};
  if ("id" in tableColumns) {
    value.id = randomUUID();
  }
  value.name = category.name;
  value.slug = category.slug;
  if ("description" in tableColumns) {
    value.description = category.description;
  }
  if ("isActive" in tableColumns) {
    value.isActive = true;
  }
  if ("createdAt" in tableColumns) {
    value.createdAt = now;
  }
  if ("updatedAt" in tableColumns) {
    value.updatedAt = now;
  }
  return value as typeof categories.$inferInsert;
}
async function main() {
  const existingCategories = await db
    .select({
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(asc(categories.name));
  const existingSlugs = new Set(
    existingCategories.map((category) => category.slug.toLowerCase()),
  );
  const missingCategories = defaults.filter(
    (category) => !existingSlugs.has(category.slug.toLowerCase()),
  );
  if (missingCategories.length > 0) {
    await db.insert(categories).values(missingCategories.map(createInsertValue));
  }
  const finalCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(asc(categories.name));
  if (finalCategories.length === 0) {
    throw new Error("Category seeding failed: the categories table is empty.");
  }
  console.log(
    JSON.stringify(
      {
        inserted: missingCategories.length,
        count: finalCategories.length,
        categories: finalCategories,
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
