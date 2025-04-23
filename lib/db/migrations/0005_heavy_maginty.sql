CREATE TABLE IF NOT EXISTS "chat_bot_knowledge_bases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_bot_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_bot_knowledge_bases" ADD CONSTRAINT "chat_bot_knowledge_bases_chat_bot_id_chat_bots_id_fk" FOREIGN KEY ("chat_bot_id") REFERENCES "public"."chat_bots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_bot_knowledge_bases" ADD CONSTRAINT "chat_bot_knowledge_bases_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
