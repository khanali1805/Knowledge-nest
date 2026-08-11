CREATE TABLE IF NOT EXISTS "design_code_revisions" (
    "id" uuid PRIMARY KEY NOT NULL,
    "name" varchar(120) NOT NULL,
    "code" text NOT NULL,
    "checksum" varchar(64) NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "activated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "design_code_state" (
    "id" varchar(40) PRIMARY KEY NOT NULL,
    "draft_name" varchar(120) NOT NULL,
    "draft_code" text NOT NULL,
    "active_revision_id" uuid,
    "last_valid_revision_id" uuid,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "design_code_state"
 ADD CONSTRAINT "design_code_state_active_revision_id_design_code_revisions_id_fk"
 FOREIGN KEY ("active_revision_id")
 REFERENCES "public"."design_code_revisions"("id")
 ON DELETE restrict
 ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "design_code_state"
 ADD CONSTRAINT "design_code_state_last_valid_revision_id_design_code_revisions_id_fk"
 FOREIGN KEY ("last_valid_revision_id")
 REFERENCES "public"."design_code_revisions"("id")
 ON DELETE restrict
 ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
