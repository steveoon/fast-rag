DO $$ BEGIN
 CREATE TYPE "public"."chatbot_status" AS ENUM('active', 'disabled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"client_id" uuid NOT NULL,
	"status" "chatbot_status" DEFAULT 'disabled' NOT NULL,
	"url" varchar(1024) NOT NULL,
	"tools_config" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_bots_name_client_unique" UNIQUE("name","client_id"),
	CONSTRAINT "chat_bots_url_unique" UNIQUE("url")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_bots" ADD CONSTRAINT "chat_bots_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
