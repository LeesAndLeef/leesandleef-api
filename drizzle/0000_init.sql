CREATE TYPE "public"."cart_list" AS ENUM('cart', 'saved');--> statement-breakpoint
CREATE TYPE "public"."oil_level" AS ENUM('Delicate', 'Medium', 'Robust');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('placed', 'paid', 'shipped', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pay_method" AS ENUM('card', 'wallet', 'bank');--> statement-breakpoint
CREATE TYPE "public"."ship_method" AS ENUM('std', 'sat', 'pick');--> statement-breakpoint
CREATE TYPE "public"."wine_type" AS ENUM('Red', 'White', 'Orange', 'Rosé', 'Sparkling', 'Dessert');--> statement-breakpoint
CREATE TABLE "articles" (
	"slug" text PRIMARY KEY NOT NULL,
	"no" integer NOT NULL,
	"tag" text NOT NULL,
	"read" text NOT NULL,
	"title" text NOT NULL,
	"lede" text NOT NULL,
	"dek" text NOT NULL,
	"img" text NOT NULL,
	"alt" text NOT NULL,
	"caption" text NOT NULL,
	"pattern" text NOT NULL,
	"author" text NOT NULL,
	"author_img" text NOT NULL,
	"date" text NOT NULL,
	"toc" jsonb NOT NULL,
	"short" text[] NOT NULL,
	"products_title" text NOT NULL,
	"products" jsonb NOT NULL,
	CONSTRAINT "articles_no_unique" UNIQUE("no")
);
--> statement-breakpoint
CREATE TABLE "cart_lines" (
	"cart_id" uuid NOT NULL,
	"list" "cart_list" NOT NULL,
	"key" text NOT NULL,
	"item_id" text NOT NULL,
	"option" text,
	"qty" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_lines_cart_id_list_key_pk" PRIMARY KEY("cart_id","list","key")
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo" text,
	"gift_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"tag" text NOT NULL,
	"bottles" integer NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"price_season" numeric(10, 2) NOT NULL,
	"price_month" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"perks" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growers" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"place" text NOT NULL,
	"region" text NOT NULL,
	"who" text NOT NULL,
	"people" text NOT NULL,
	"ha" text NOT NULL,
	"since" text NOT NULL,
	"grapes" text[] NOT NULL,
	"tone" text NOT NULL,
	"quote" text NOT NULL,
	"portrait" text,
	"profile" jsonb
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"email" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oils" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"grower_id" text,
	"grower_name" text,
	"region" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"left" integer,
	"glass" text NOT NULL,
	"cap" text NOT NULL,
	"note" text NOT NULL,
	"cultivar" text NOT NULL,
	"origin" text NOT NULL,
	"level" "oil_level" NOT NULL,
	"bitter" integer NOT NULL,
	"pepper" integer NOT NULL,
	"fruit" integer NOT NULL,
	"poly" text NOT NULL,
	"acid" text NOT NULL,
	"harvest" text NOT NULL,
	"limited" boolean DEFAULT false NOT NULL,
	"set" jsonb,
	"detail" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"order_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"item_id" text NOT NULL,
	"kind" text NOT NULL,
	"option" text,
	"name" text NOT NULL,
	"meta" text NOT NULL,
	"unit" numeric(10, 2) NOT NULL,
	"qty" integer NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	CONSTRAINT "order_lines_order_id_position_pk" PRIMARY KEY("order_id","position")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"status" "order_status" DEFAULT 'placed' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"ship_method" "ship_method" NOT NULL,
	"street" text,
	"postcode" text,
	"city" text,
	"country" text,
	"door" text,
	"pay_method" "pay_method" NOT NULL,
	"gift_note" text,
	"promo" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"mix_discount" numeric(10, 2) NOT NULL,
	"promo_discount" numeric(10, 2) NOT NULL,
	"shipping" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"rate" numeric(4, 3) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_profiles" (
	"style" "wine_type" PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"position" integer PRIMARY KEY NOT NULL,
	"q" text NOT NULL,
	"answers" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grower_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"date" date NOT NULL,
	"guests" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wines" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"grower_id" text,
	"grower_name" text,
	"region" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"left" integer,
	"glass" text NOT NULL,
	"cap" text NOT NULL,
	"note" text NOT NULL,
	"type" "wine_type" NOT NULL,
	"grape" text NOT NULL,
	"abv" text NOT NULL,
	"volume" text,
	"home_note" text,
	"badge" text,
	"release_rank" integer NOT NULL,
	"unlisted" boolean DEFAULT false NOT NULL,
	"so2" integer NOT NULL,
	"so2_added" boolean NOT NULL,
	"vegan" boolean NOT NULL,
	"amphora" boolean NOT NULL,
	"magnum" boolean NOT NULL,
	"detail" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_promo_promo_codes_code_fk" FOREIGN KEY ("promo") REFERENCES "public"."promo_codes"("code") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oils" ADD CONSTRAINT "oils_grower_id_growers_id_fk" FOREIGN KEY ("grower_id") REFERENCES "public"."growers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_grower_id_growers_id_fk" FOREIGN KEY ("grower_id") REFERENCES "public"."growers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wines" ADD CONSTRAINT "wines_grower_id_growers_id_fk" FOREIGN KEY ("grower_id") REFERENCES "public"."growers"("id") ON DELETE no action ON UPDATE no action;