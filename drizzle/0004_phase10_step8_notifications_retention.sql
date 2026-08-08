CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_username" varchar(150) NOT NULL,
	"type" varchar(80) NOT NULL,
	"severity" varchar(30) DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"article_id" uuid,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_key" varchar(80) DEFAULT 'default' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"activity_retention_days" integer DEFAULT 180 NOT NULL,
	"notification_retention_days" integer DEFAULT 90 NOT NULL,
	"revision_retention_days" integer DEFAULT 365 NOT NULL,
	"last_cleanup_at" timestamp with time zone,
	"updated_by" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notifications_recipient_index" ON "admin_notifications" USING btree ("recipient_username");--> statement-breakpoint
CREATE INDEX "admin_notifications_read_index" ON "admin_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "admin_notifications_created_index" ON "admin_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_notifications_article_index" ON "admin_notifications" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_retention_policy_key_unique" ON "audit_retention_policies" USING btree ("policy_key");