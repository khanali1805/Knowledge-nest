ALTER TABLE "article_revisions" ADD COLUMN "snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "reason" varchar(30) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE INDEX "article_revisions_article_index" ON "article_revisions" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_revisions_created_index" ON "article_revisions" USING btree ("created_at");