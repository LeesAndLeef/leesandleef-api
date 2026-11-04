ALTER TABLE "orders" DROP CONSTRAINT "orders_cart_id_carts_id_fk";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "cart_id";--> statement-breakpoint
DROP TABLE "cart_lines";--> statement-breakpoint
DROP TABLE "carts";--> statement-breakpoint
DROP TYPE "public"."cart_list";
