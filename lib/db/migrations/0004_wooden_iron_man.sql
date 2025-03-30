CREATE TABLE IF NOT EXISTS "chat_bot_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_bot_id" uuid NOT NULL,
	"client_tool_id" uuid NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_bot_tools_bot_tool_unique" UNIQUE("chat_bot_id","client_tool_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_bot_tools" ADD CONSTRAINT "chat_bot_tools_chat_bot_id_chat_bots_id_fk" FOREIGN KEY ("chat_bot_id") REFERENCES "public"."chat_bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_bot_tools" ADD CONSTRAINT "chat_bot_tools_client_tool_id_client_tools_id_fk" FOREIGN KEY ("client_tool_id") REFERENCES "public"."client_tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "chat_bots" DROP COLUMN IF EXISTS "tools_config";