CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"description" text,
	"categories" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_models_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
ALTER TABLE "chat_bots" ADD COLUMN "model_id" varchar(255) DEFAULT 'anthropic/claude-haiku-4-5';