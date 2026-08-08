CREATE TABLE "article_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"username" varchar(150) NOT NULL,
	"action" varchar(80) NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_editor_presence" (
	"article_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"username" varchar(150) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "article_editor_presence_article_id_session_id_pk" PRIMARY KEY("article_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "article_activity_logs" ADD CONSTRAINT "article_activity_logs_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_editor_presence" ADD CONSTRAINT "article_editor_presence_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_activity_article_index" ON "article_activity_logs" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_activity_created_index" ON "article_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "article_activity_action_index" ON "article_activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "article_presence_article_index" ON "article_editor_presence" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_presence_expiry_index" ON "article_editor_presence" USING btree ("expires_at");