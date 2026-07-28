import { z } from "zod";
export const siteSettingsInputSchema = z.object({
  siteName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(255),
  siteUrl: z.url().max(500),
  adminEmail: z.email().max(255),
  postsPerPage: z.coerce.number().int().min(1).max(100),
  language: z.enum(["en"]),
  timezone: z.string().trim().min(1).max(100),
  indexSite: z.boolean(),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
