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
export const articleInputSchema = z.object({
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
  seoTitle: optionalTextSchema,
  seoDescription: optionalTextSchema,
  canonicalUrl: optionalTextSchema,
  focusKeyword: optionalTextSchema,
  readingTimeMinutes: z.number().int().min(1).max(1000).default(1),
  isFeatured: z.boolean().default(false),
  scheduledAt: z
    .union([z.iso.datetime(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? new Date(value) : null)),
});
export const articleUpdateSchema = articleInputSchema.partial();
export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ArticleUpdate = z.infer<typeof articleUpdateSchema>;
