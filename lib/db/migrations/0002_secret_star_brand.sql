DO $$ BEGIN
 CREATE TYPE "public"."tool_parameter_type" AS ENUM('string', 'number', 'boolean', 'array', 'object');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tool_status" AS ENUM('active', 'deprecated', 'disabled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_tools_client_tool_unique" UNIQUE("client_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "tool_parameter_type" NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" jsonb,
	"enum_values" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_parameters_tool_name_unique" UNIQUE("tool_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(100),
	"status" "tool_status" DEFAULT 'active' NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"implementation_key" varchar(100) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tools_name_unique" UNIQUE("name"),
	CONSTRAINT "tools_implementation_key_unique" UNIQUE("implementation_key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_tools" ADD CONSTRAINT "client_tools_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_tools" ADD CONSTRAINT "client_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_parameters" ADD CONSTRAINT "tool_parameters_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
