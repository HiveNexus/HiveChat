CREATE TYPE "public"."api_style" AS ENUM('openai', 'claude', 'gemini');--> statement-breakpoint
CREATE TYPE "public"."avatar_type" AS ENUM('emoji', 'url', 'none');--> statement-breakpoint
CREATE TYPE "public"."history_type" AS ENUM('all', 'count', 'none');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'error', 'break');--> statement-breakpoint
CREATE TYPE "public"."model_type" AS ENUM('default', 'custom');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('default', 'custom');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"desc" varchar(255),
	"prompt" varchar(10000),
	"avatar_type" "avatar_type" DEFAULT 'none' NOT NULL,
	"avatar" varchar,
	"source_url" varchar,
	"creator" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"delete_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"title" varchar(255) NOT NULL,
	"history_type" "history_type" DEFAULT 'count' NOT NULL,
	"history_count" integer DEFAULT 5 NOT NULL,
	"is_star" boolean DEFAULT false,
	"is_with_bot" boolean DEFAULT false,
	"bot_id" integer,
	"avatar" varchar,
	"avatar_type" "avatar_type" DEFAULT 'none' NOT NULL,
	"prompt" text,
	"star_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "models_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"maxTokens" integer,
	"support_vision" boolean DEFAULT false,
	"selected" boolean DEFAULT true,
	"providerId" varchar(255) NOT NULL,
	"providerName" varchar(255) NOT NULL,
	"type" "model_type" DEFAULT 'default' NOT NULL,
	"order" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_model_provider" UNIQUE("name","providerId")
);
--> statement-breakpoint
CREATE TABLE "llm_settings" (
	"provider" varchar(255) PRIMARY KEY NOT NULL,
	"providerName" varchar(255) NOT NULL,
	"apikey" varchar(255),
	"endpoint" varchar(1024),
	"is_active" boolean DEFAULT false,
	"api_style" "api_style" DEFAULT 'openai',
	"type" "provider_type" DEFAULT 'default' NOT NULL,
	"logo" varchar(2048),
	"order" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" text NOT NULL,
	"chatId" text NOT NULL,
	"role" varchar(255) NOT NULL,
	"content" json,
	"reasonin_content" text,
	"model" varchar(255),
	"providerId" varchar(255) NOT NULL,
	"message_type" varchar DEFAULT 'text' NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"error_type" varchar,
	"error_message" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"delete_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_llm_settings" (
	"userId" text NOT NULL,
	"llmProvider" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"password" text,
	"feishuUserId" text,
	"feishuOpenId" text,
	"feishuUnionId" text,
	"emailVerified" timestamp,
	"isAdmin" boolean DEFAULT false,
	"image" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_llm_settings" ADD CONSTRAINT "user_llm_settings_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_llm_settings" ADD CONSTRAINT "user_llm_settings_llmProvider_llm_settings_provider_fk" FOREIGN KEY ("llmProvider") REFERENCES "public"."llm_settings"("provider") ON DELETE cascade ON UPDATE no action;