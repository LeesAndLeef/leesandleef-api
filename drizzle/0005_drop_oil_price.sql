ALTER TABLE "oil_sizes" ALTER COLUMN "size" DROP NOT NULL;--> statement-breakpoint
INSERT INTO "oil_sizes" ("id", "oil_id", "size", "label", "name", "price", "position")
SELECT "id", "id", NULL, "set"->>'contents', 'Tasting set', "price", 0
FROM "oils"
WHERE "set" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "oils" DROP COLUMN "price";
