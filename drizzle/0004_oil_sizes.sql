CREATE TYPE "public"."oil_size" AS ENUM('250', '500', '3000');--> statement-breakpoint
CREATE TABLE "oil_sizes" (
	"id" text PRIMARY KEY NOT NULL,
	"oil_id" text NOT NULL,
	"size" "oil_size" NOT NULL,
	"label" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "oil_sizes_oilId_size_unique" UNIQUE("oil_id","size")
);
--> statement-breakpoint
ALTER TABLE "oil_sizes" ADD CONSTRAINT "oil_sizes_oil_id_oils_id_fk" FOREIGN KEY ("oil_id") REFERENCES "public"."oils"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "oil_sizes" ("id", "oil_id", "size", "label", "name", "price", "position")
SELECT "oils"."id" || '-' || "s"."size", "oils"."id", "s"."size"::"oil_size", "s"."label", "s"."name", round("oils"."price" * "s"."factor"), "s"."position"
FROM "oils"
CROSS JOIN (VALUES ('250', '250 ml', '250 ml tin', 0.6, 0), ('500', '500 ml', '500 ml tin', 1, 1), ('3000', '3 L', '3 L tin', 4.6, 2)) AS "s"("size", "label", "name", "factor", "position")
WHERE "oils"."set" IS NULL;
