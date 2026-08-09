ALTER TABLE "media"
ADD COLUMN IF NOT EXISTS "file_data" bytea;
--> statement-breakpoint