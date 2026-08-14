import { z } from "zod";
export const articleStatusSchema = z.enum([
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
]);
const optionalUuidSchema = z
  .union([z.uuid(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));
const optionalTextSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue || null;
  });
const optionalSeoTitleSchema = z
  .union([z.string().trim().max(60), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }
    return value || null;
  });
const optionalSeoDescriptionSchema = z
  .union([z.string().trim().max(160), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }
    return value || null;
  });
const articleTagsInputSchema = z
  .union([z.string(), z.array(z.string()), z.null()])
  .optional()
  .transform((value) => {
    const rawTags = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(",")
        : [];
    const tagsByKey = new Map<string, string>();
    for (const rawTag of rawTags) {
      const cleanTag = rawTag.trim();
      if (!cleanTag) {
        continue;
      }
      if (cleanTag.length > 100) {
        throw new Error("Each article tag must be 100 characters or fewer.");
      }
      const key = cleanTag.toLowerCase();
      if (!tagsByKey.has(key)) {
        tagsByKey.set(key, cleanTag);
      }
    }
    return Array.from(tagsByKey.values());
  });
const articleBaseSchema = z.object({
  title: z.string().trim().min(3).max(255),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: optionalTextSchema,
  content: z.string().trim().min(1),
  categoryId: optionalUuidSchema,
  featuredImageId: optionalUuidSchema,
  status: articleStatusSchema.default("draft"),
  seoTitle: optionalSeoTitleSchema,
  seoDescription: optionalSeoDescriptionSchema,
  canonicalUrl: optionalTextSchema,
  focusKeyword: optionalTextSchema,
  tags: articleTagsInputSchema,
  readingTimeMinutes: z.number().int().min(1).max(1000).default(1),
  isFeatured: z.boolean().default(false),
  scheduledAt: z
    .union([z.iso.datetime(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? new Date(value) : null)),
});

export const articleInputSchema = articleBaseSchema.superRefine((value, context) => {
  if (value.status !== "published") {
    return;
  }
  const seoTitleLength = value.seoTitle?.length ?? 0;
  const seoDescriptionLength = value.seoDescription?.length ?? 0;
  if (seoTitleLength < 30 || seoTitleLength > 60) {
    context.addIssue({
      code: "custom",
      path: ["seoTitle"],
      message: "Published articles require an SEO title between 30 and 60 characters.",
    });
  }
  if (seoDescriptionLength < 120 || seoDescriptionLength > 160) {
    context.addIssue({
      code: "custom",
      path: ["seoDescription"],
      message:
        "Published articles require an SEO description between 120 and 160 characters.",
    });
  }
});
export const articleUpdateSchema = articleBaseSchema.partial();
export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ArticleUpdate = z.infer<typeof articleUpdateSchema>;
