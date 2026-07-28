import { z } from "zod";
const pageStatusSchema = z.enum(["draft", "published"]);
const nullableTextSchema = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return value;
    }
    return value || null;
  });
export const pageInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().trim().min(1),
  status: pageStatusSchema.default("draft"),
  seoTitle: nullableTextSchema,
  seoDescription: nullableTextSchema,
});
export const pageUpdateSchema = pageInputSchema.partial();
export type PageInput = z.infer<typeof pageInputSchema>;
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>;
