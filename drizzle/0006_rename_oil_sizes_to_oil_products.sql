ALTER TABLE "oil_sizes" RENAME TO "oil_products";--> statement-breakpoint
ALTER TABLE "oil_products" RENAME CONSTRAINT "oil_sizes_pkey" TO "oil_products_pkey";--> statement-breakpoint
ALTER TABLE "oil_products" RENAME CONSTRAINT "oil_sizes_oilId_size_unique" TO "oil_products_oilId_size_unique";--> statement-breakpoint
ALTER TABLE "oil_products" RENAME CONSTRAINT "oil_sizes_oil_id_oils_id_fk" TO "oil_products_oil_id_oils_id_fk";
