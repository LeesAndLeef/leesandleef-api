ALTER TABLE "oil_styles" ADD COLUMN "release_date" timestamp with time zone;--> statement-breakpoint
UPDATE "oil_styles" SET "release_date" = "dates"."release_date"
FROM (VALUES
	('istarska-bjelica', timestamptz '2025-10-01T09:00:00.000Z'),
	('rosinjola-early-harvest', timestamptz '2025-09-24T09:00:00.000Z'),
	('buza-grove-14', timestamptz '2025-09-17T09:00:00.000Z'),
	('levantinka-solta', timestamptz '2025-09-10T09:00:00.000Z'),
	('oblica-island-blend', timestamptz '2025-09-03T09:00:00.000Z'),
	('leccino-vodnjan', timestamptz '2025-08-27T09:00:00.000Z'),
	('olio-nuovo-unfiltered', timestamptz '2025-08-20T09:00:00.000Z'),
	('oil-tasting-set', timestamptz '2025-08-13T09:00:00.000Z')
) AS "dates"("id", "release_date")
WHERE "oil_styles"."id" = "dates"."id";--> statement-breakpoint
UPDATE "oil_styles" SET "release_date" = now() WHERE "release_date" IS NULL;--> statement-breakpoint
ALTER TABLE "oil_styles" ALTER COLUMN "release_date" SET NOT NULL;
