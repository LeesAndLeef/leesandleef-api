ALTER TABLE "oils" RENAME TO "oil_styles";--> statement-breakpoint
ALTER TABLE "oil_styles" RENAME CONSTRAINT "oils_pkey" TO "oil_styles_pkey";--> statement-breakpoint
ALTER TABLE "oil_styles" RENAME CONSTRAINT "oils_grower_id_growers_id_fk" TO "oil_styles_grower_id_growers_id_fk";--> statement-breakpoint
ALTER TABLE "oil_products" RENAME TO "oils";--> statement-breakpoint
ALTER TABLE "oils" RENAME CONSTRAINT "oil_products_pkey" TO "oils_pkey";--> statement-breakpoint
ALTER TABLE "oils" RENAME COLUMN "oil_id" TO "style_id";--> statement-breakpoint
ALTER TABLE "oils" RENAME CONSTRAINT "oil_products_oilId_size_unique" TO "oils_styleId_size_unique";--> statement-breakpoint
ALTER TABLE "oils" RENAME CONSTRAINT "oil_products_oil_id_oils_id_fk" TO "oils_style_id_oil_styles_id_fk";--> statement-breakpoint
ALTER TABLE "oils" ADD COLUMN "was_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "oils" ADD COLUMN "left" integer;--> statement-breakpoint
UPDATE "oils" SET "left" = "oil_styles"."left"
FROM "oil_styles"
WHERE "oils"."style_id" = "oil_styles"."id" AND "oil_styles"."left" IS NOT NULL AND ("oils"."size" = '500' OR "oils"."size" IS NULL);--> statement-breakpoint
UPDATE "oils" SET "was_price" = ("oil_styles"."set"->>'was')::numeric
FROM "oil_styles"
WHERE "oils"."style_id" = "oil_styles"."id" AND "oil_styles"."set" ? 'was';--> statement-breakpoint
UPDATE "oil_styles" SET "set" = "set" - 'was' WHERE "set" ? 'was';--> statement-breakpoint
ALTER TABLE "oil_styles" DROP COLUMN "left";
