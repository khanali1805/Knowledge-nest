CREATE TABLE "article_edit_locks" (
	"article_id" uuid PRIMARY KEY NOT NULL,
	"owner_username" varchar(150) NOT NULL,
	"lock_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_edit_locks" ADD CONSTRAINT "article_edit_locks_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_edit_locks_token_unique" ON "article_edit_locks" USING btree ("lock_token");--> statement-breakpoint
CREATE INDEX "article_edit_locks_expiry_index" ON "article_edit_locks" USING btree ("expires_at");