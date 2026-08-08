CREATE TABLE "admin_notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"recipient_username" varchar(150) NOT NULL,
	"channel" varchar(30) NOT NULL,
	"destination" text,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processing_started_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(150) NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"webhook_enabled" boolean DEFAULT false NOT NULL,
	"email_address" varchar(320),
	"webhook_url" text,
	"minimum_severity" varchar(30) DEFAULT 'info' NOT NULL,
	"collaboration_alerts" boolean DEFAULT true NOT NULL,
	"critical_activity_alerts" boolean DEFAULT true NOT NULL,
	"multiple_editor_alerts" boolean DEFAULT true NOT NULL,
	"retention_alerts" boolean DEFAULT true NOT NULL,
	"digest_enabled" boolean DEFAULT false NOT NULL,
	"digest_interval_minutes" integer DEFAULT 60 NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" varchar(5) DEFAULT '22:00' NOT NULL,
	"quiet_hours_end" varchar(5) DEFAULT '07:00' NOT NULL,
	"timezone" varchar(80) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_scheduler_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheduler_key" varchar(80) DEFAULT 'notification-delivery' NOT NULL,
	"status" varchar(30) DEFAULT 'running' NOT NULL,
	"trigger" varchar(30) DEFAULT 'manual' NOT NULL,
	"deliveries_queued" integer DEFAULT 0 NOT NULL,
	"deliveries_processed" integer DEFAULT 0 NOT NULL,
	"deliveries_succeeded" integer DEFAULT 0 NOT NULL,
	"deliveries_failed" integer DEFAULT 0 NOT NULL,
	"retention_cleanup_ran" boolean DEFAULT false NOT NULL,
	"alert_scan_ran" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_notification_deliveries" ADD CONSTRAINT "admin_notification_deliveries_notification_id_admin_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."admin_notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notification_deliveries_notification_index" ON "admin_notification_deliveries" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "admin_notification_deliveries_recipient_index" ON "admin_notification_deliveries" USING btree ("recipient_username");--> statement-breakpoint
CREATE INDEX "admin_notification_deliveries_status_index" ON "admin_notification_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_notification_deliveries_schedule_index" ON "admin_notification_deliveries" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "admin_notification_deliveries_retry_index" ON "admin_notification_deliveries" USING btree ("next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_notification_delivery_channel_unique" ON "admin_notification_deliveries" USING btree ("notification_id","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_notification_preferences_username_unique" ON "admin_notification_preferences" USING btree ("username");--> statement-breakpoint
CREATE INDEX "admin_notification_preferences_email_index" ON "admin_notification_preferences" USING btree ("email_enabled");--> statement-breakpoint
CREATE INDEX "admin_notification_preferences_webhook_index" ON "admin_notification_preferences" USING btree ("webhook_enabled");--> statement-breakpoint
CREATE INDEX "admin_notification_preferences_digest_index" ON "admin_notification_preferences" USING btree ("digest_enabled");--> statement-breakpoint
CREATE INDEX "notification_scheduler_runs_key_index" ON "notification_scheduler_runs" USING btree ("scheduler_key");--> statement-breakpoint
CREATE INDEX "notification_scheduler_runs_status_index" ON "notification_scheduler_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_scheduler_runs_started_index" ON "notification_scheduler_runs" USING btree ("started_at");