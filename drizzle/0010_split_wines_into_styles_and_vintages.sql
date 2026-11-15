ALTER TABLE "wines" RENAME TO "wine_styles";--> statement-breakpoint
ALTER TABLE "wine_styles" RENAME CONSTRAINT "wines_pkey" TO "wine_styles_pkey";--> statement-breakpoint
ALTER TABLE "wine_styles" RENAME CONSTRAINT "wines_grower_id_growers_id_fk" TO "wine_styles_grower_id_growers_id_fk";--> statement-breakpoint
ALTER TABLE "wine_styles" ADD COLUMN "release_date" timestamp with time zone;--> statement-breakpoint
UPDATE "wine_styles" SET "release_date" = timestamptz '2025-10-01 10:00:00+00' - ("release_rank" - 1) * interval '7 days';--> statement-breakpoint
ALTER TABLE "wine_styles" ALTER COLUMN "release_date" SET NOT NULL;--> statement-breakpoint
CREATE TABLE "wines" (
	"id" text PRIMARY KEY NOT NULL,
	"style_id" text NOT NULL,
	"vintage" text,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"left" integer,
	"pre_order" text,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "wines_styleId_vintage_unique" UNIQUE("style_id","vintage")
);
--> statement-breakpoint
ALTER TABLE "wines" ADD CONSTRAINT "wines_style_id_wine_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."wine_styles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wines_style_id_index" ON "wines" USING btree ("style_id") WHERE "wines"."is_default";--> statement-breakpoint
INSERT INTO "wines" ("id", "style_id", "vintage", "name", "price", "left", "pre_order", "is_default")
SELECT
	"s"."id" || '-' || ("v"->>'year'),
	"s"."id",
	"v"->>'year',
	regexp_replace("s"."name", '\s\d{4}$', '') || ' ' || ("v"->>'year'),
	("v"->>'price')::numeric,
	CASE WHEN "v"->>'year' = "s"."detail"->>'defaultVintage' THEN "s"."left" ELSE substring("v"->>'info' from '· (\d+) left')::integer END,
	substring("v"->>'info' from '^Pre-order · (.+)$'),
	"v"->>'year' = "s"."detail"->>'defaultVintage'
FROM "wine_styles" AS "s"
CROSS JOIN jsonb_array_elements("s"."detail"->'vintages') AS "v"
WHERE jsonb_array_length(coalesce("s"."detail"->'vintages', '[]'::jsonb)) > 0;--> statement-breakpoint
INSERT INTO "wines" ("id", "style_id", "vintage", "name", "price", "left", "is_default")
SELECT "id", "id", NULL, "name", "price", "left", true
FROM "wine_styles"
WHERE jsonb_array_length(coalesce("detail"->'vintages', '[]'::jsonb)) = 0;--> statement-breakpoint
UPDATE "wine_styles" SET "name" = regexp_replace("name", '\s\d{4}$', '')
WHERE jsonb_array_length(coalesce("detail"->'vintages', '[]'::jsonb)) > 0;--> statement-breakpoint
UPDATE "wine_styles" SET "detail" = "detail" - 'vintages' - 'defaultVintage';--> statement-breakpoint
ALTER TABLE "wine_styles" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "wine_styles" DROP COLUMN "left";--> statement-breakpoint
ALTER TABLE "wine_styles" DROP COLUMN "badge";--> statement-breakpoint
ALTER TABLE "wine_styles" DROP COLUMN "release_rank";
