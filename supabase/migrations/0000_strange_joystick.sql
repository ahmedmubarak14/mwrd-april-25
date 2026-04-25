CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('open', 'submitted_for_approval', 'converted_to_order', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."invoice_provider" AS ENUM('standard', 'zatca');--> statement-breakpoint
CREATE TYPE "public"."join_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'mada', 'apple_pay', 'stc_pay', 'wallet', 'po', 'wallet_topup');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose" AS ENUM('order_payment', 'wallet_topup', 'refund');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('initiated', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'chargeback');--> statement-breakpoint
CREATE TYPE "public"."refund_method" AS ENUM('wallet', 'original');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('damaged', 'wrong_item', 'quality_issue', 'no_longer_needed', 'other');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('submitted', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role_scope" AS ENUM('company', 'department');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending_verification', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."vendor_user_role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."wallet_txn_type" AS ENUM('topup', 'debit_for_order', 'refund_credit', 'adjustment_credit', 'adjustment_debit');--> statement-breakpoint
CREATE TYPE "public"."webhook_provider" AS ENUM('moyasar');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"department_id" uuid,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"address_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"legal_name_ar" text,
	"legal_name_en" text,
	"cr_number" text,
	"vat_number" text,
	"email_domain" text,
	"logo_url" text,
	"default_locale" "locale" DEFAULT 'ar' NOT NULL,
	"po_required_at_checkout" boolean DEFAULT false NOT NULL,
	"approval_threshold_halalas" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_approval_threshold_non_negative" CHECK ("companies"."approval_threshold_halalas" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"message" text,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"department_id" uuid,
	"role_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"parent_department_id" uuid,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_key" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_key_pk" PRIMARY KEY("role_id","permission_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" text NOT NULL,
	"display_name_ar" text NOT NULL,
	"display_name_en" text NOT NULL,
	"scope" "role_scope" NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name_ar" text,
	"full_name_en" text,
	"phone" text,
	"locale" "locale" DEFAULT 'ar' NOT NULL,
	"active_company_id" uuid,
	"active_vendor_id" uuid,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"role" "vendor_user_role" DEFAULT 'staff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name_ar" text NOT NULL,
	"legal_name_en" text NOT NULL,
	"display_name_ar" text NOT NULL,
	"display_name_en" text NOT NULL,
	"cr_number" text NOT NULL,
	"cr_verified_at" timestamp with time zone,
	"vat_number" text,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"logo_url" text,
	"status" "vendor_status" DEFAULT 'pending_verification' NOT NULL,
	"bank_account_iban" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_category_id" uuid,
	"slug" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unit_ar" text NOT NULL,
	"unit_en" text NOT NULL,
	"price_halalas" integer NOT NULL,
	"vat_rate" numeric(5, 4) DEFAULT '0.1500' NOT NULL,
	"min_order_qty" integer DEFAULT 1 NOT NULL,
	"max_order_qty" integer,
	"stock_on_hand" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"search_ar" "tsvector",
	"search_en" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_non_negative" CHECK ("products"."price_halalas" >= 0),
	CONSTRAINT "products_min_order_qty_positive" CHECK ("products"."min_order_qty" >= 1),
	CONSTRAINT "products_vat_rate_bounds" CHECK ("products"."vat_rate" >= 0 AND "products"."vat_rate" <= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "address_group_members" (
	"address_group_id" uuid NOT NULL,
	"address_id" uuid NOT NULL,
	CONSTRAINT "address_group_members_address_group_id_address_id_pk" PRIMARY KEY("address_group_id","address_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "address_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"label" text NOT NULL,
	"recipient_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'SA' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_country_sa_only" CHECK ("addresses"."country" = 'SA')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_halalas_snapshot" integer NOT NULL,
	"destination_address_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_quantity_positive" CHECK ("cart_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "cart_status" DEFAULT 'open' NOT NULL,
	"submitted_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid,
	"order_id" uuid,
	"requested_by" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "order_approvals_cart_or_order" CHECK ("order_approvals"."cart_id" is not null OR "order_approvals"."order_id" is not null)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name_ar_snapshot" text NOT NULL,
	"product_name_en_snapshot" text NOT NULL,
	"sku_snapshot" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_halalas" integer NOT NULL,
	"vat_rate" numeric(5, 4) NOT NULL,
	"line_subtotal_halalas" integer NOT NULL,
	"line_vat_halalas" integer NOT NULL,
	"line_total_halalas" integer NOT NULL,
	"destination_address_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_order_number" text NOT NULL,
	"supplier_order_number" text NOT NULL,
	"company_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"subtotal_halalas" integer NOT NULL,
	"vat_halalas" integer NOT NULL,
	"total_halalas" integer NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"po_file_url" text,
	"po_number" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_subtotal_non_negative" CHECK ("orders"."subtotal_halalas" >= 0),
	CONSTRAINT "orders_vat_non_negative" CHECK ("orders"."vat_halalas" >= 0),
	CONSTRAINT "orders_total_non_negative" CHECK ("orders"."total_halalas" >= 0),
	CONSTRAINT "orders_currency_sar" CHECK ("orders"."currency" = 'SAR')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb,
	"http_status" integer,
	"error_code" text,
	"error_message" text,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"wallet_id" uuid,
	"amount_halalas" integer NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"method" "payment_method" NOT NULL,
	"purpose" "payment_purpose" NOT NULL,
	"moyasar_payment_id" text,
	"status" "payment_status" DEFAULT 'initiated' NOT NULL,
	"idempotency_key" text NOT NULL,
	"captured_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_non_negative" CHECK ("payments"."amount_halalas" >= 0),
	CONSTRAINT "payments_currency_sar" CHECK ("payments"."currency" = 'SAR')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"type" "wallet_txn_type" NOT NULL,
	"amount_halalas" integer NOT NULL,
	"balance_after_halalas" integer NOT NULL,
	"order_id" uuid,
	"payment_id" uuid,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_amount_non_negative" CHECK ("wallet_transactions"."amount_halalas" >= 0),
	CONSTRAINT "wallet_transactions_balance_after_non_negative" CHECK ("wallet_transactions"."balance_after_halalas" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"balance_halalas" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_balance_non_negative" CHECK ("wallets"."balance_halalas" >= 0),
	CONSTRAINT "wallets_currency_sar" CHECK ("wallets"."currency" = 'SAR')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_tags" (
	"order_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "order_tags_order_id_tag_id_pk" PRIMARY KEY("order_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "return_items" (
	"return_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity_returned" integer NOT NULL,
	CONSTRAINT "return_items_return_id_order_item_id_pk" PRIMARY KEY("return_id","order_item_id"),
	CONSTRAINT "return_items_quantity_positive" CHECK ("return_items"."quantity_returned" >= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"status" "return_status" DEFAULT 'submitted' NOT NULL,
	"reason_code" "return_reason" NOT NULL,
	"reason_text" text,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"refund_method" "refund_method",
	"refund_amount_halalas" integer,
	"moyasar_refund_id" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "returns_refund_amount_non_negative" CHECK ("returns"."refund_amount_halalas" is null OR "returns"."refund_amount_halalas" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favourite_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"favourite_list_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"default_quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favourite_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_shared_with_company" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider" "invoice_provider" DEFAULT 'standard' NOT NULL,
	"pdf_url" text NOT NULL,
	"seller_name_ar" text NOT NULL,
	"seller_name_en" text NOT NULL,
	"seller_cr_number" text NOT NULL,
	"seller_vat_number" text NOT NULL,
	"seller_address" text NOT NULL,
	"buyer_company_id" uuid NOT NULL,
	"buyer_name_ar" text NOT NULL,
	"buyer_name_en" text NOT NULL,
	"buyer_vat_number" text,
	"buyer_cr_number" text,
	"buyer_address" text NOT NULL,
	"subtotal_halalas" integer NOT NULL,
	"vat_halalas" integer NOT NULL,
	"total_halalas" integer NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"zatca_uuid" text,
	"zatca_hash" text,
	"zatca_submitted_at" timestamp with time zone,
	"zatca_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "webhook_provider" NOT NULL,
	"event_type" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"signature" text NOT NULL,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"related_payment_id" uuid,
	"related_order_id" uuid,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branches" ADD CONSTRAINT "branches_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_join_requests" ADD CONSTRAINT "company_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_join_requests" ADD CONSTRAINT "company_join_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_join_requests" ADD CONSTRAINT "company_join_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_members" ADD CONSTRAINT "company_members_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_members" ADD CONSTRAINT "company_members_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_members" ADD CONSTRAINT "company_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_fk" FOREIGN KEY ("parent_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_users" ADD CONSTRAINT "vendor_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_users" ADD CONSTRAINT "vendor_users_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "address_group_members" ADD CONSTRAINT "address_group_members_address_group_id_address_groups_id_fk" FOREIGN KEY ("address_group_id") REFERENCES "public"."address_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "address_group_members" ADD CONSTRAINT "address_group_members_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "address_groups" ADD CONSTRAINT "address_groups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_destination_address_id_addresses_id_fk" FOREIGN KEY ("destination_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_destination_address_id_addresses_id_fk" FOREIGN KEY ("destination_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallets" ADD CONSTRAINT "wallets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_tags" ADD CONSTRAINT "analytics_tags_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_tags" ADD CONSTRAINT "analytics_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_tags" ADD CONSTRAINT "order_tags_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_tags" ADD CONSTRAINT "order_tags_tag_id_analytics_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."analytics_tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returns" ADD CONSTRAINT "returns_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returns" ADD CONSTRAINT "returns_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourite_list_items" ADD CONSTRAINT "favourite_list_items_favourite_list_id_favourite_lists_id_fk" FOREIGN KEY ("favourite_list_id") REFERENCES "public"."favourite_lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourite_list_items" ADD CONSTRAINT "favourite_list_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourite_lists" ADD CONSTRAINT "favourite_lists_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourite_lists" ADD CONSTRAINT "favourite_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_buyer_company_id_companies_id_fk" FOREIGN KEY ("buyer_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_related_payment_id_payments_id_fk" FOREIGN KEY ("related_payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_company_idx" ON "branches" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "companies_email_domain_unique" ON "companies" USING btree ("email_domain") WHERE "companies"."email_domain" is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_vat_idx" ON "companies" USING btree ("vat_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_join_requests_company_status_idx" ON "company_join_requests" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_join_requests_pending_unique" ON "company_join_requests" USING btree ("user_id","company_id") WHERE "company_join_requests"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_members_user_company_unique" ON "company_members" USING btree ("user_id","company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_members_company_active_idx" ON "company_members" USING btree ("company_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_company_parent_idx" ON "departments" USING btree ("company_id","parent_department_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_company_name_unique" ON "roles" USING btree ("company_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_users_user_vendor_unique" ON "vendor_users" USING btree ("user_id","vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_vendor_sku_unique" ON "products" USING btree ("vendor_id","sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_active_idx" ON "products" USING btree ("category_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cart_product_dest_unique" ON "cart_items" USING btree ("cart_id","product_id","destination_address_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "carts_open_per_user_company_vendor_unique" ON "carts" USING btree ("user_id","company_id","vendor_id") WHERE "carts"."status" = 'open';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_approvals_approver_status_idx" ON "order_approvals" USING btree ("approver_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_approvals_cart_idx" ON "order_approvals" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_approvals_order_idx" ON "order_approvals" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_buyer_number_unique" ON "orders" USING btree ("buyer_order_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_supplier_number_unique" ON "orders" USING btree ("supplier_order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_company_status_idx" ON "orders" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_vendor_status_idx" ON "orders" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempts_payment_attempt_unique" ON "payment_attempts" USING btree ("payment_id","attempt_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_moyasar_id_unique" ON "payments" USING btree ("moyasar_payment_id") WHERE "payments"."moyasar_payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotency_unique" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_order_status_idx" ON "payments" USING btree ("order_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_status_created_idx" ON "payments" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_wallet_time_idx" ON "wallet_transactions" USING btree ("wallet_id","created_at" desc);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_order_idx" ON "wallet_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_payment_idx" ON "wallet_transactions" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallets_company_unique" ON "wallets" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_tags_company_name_active_unique" ON "analytics_tags" USING btree ("company_id","name") WHERE "analytics_tags"."is_active" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "returns_order_idx" ON "returns" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "returns_status_idx" ON "returns" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "favourite_list_items_list_product_unique" ON "favourite_list_items" USING btree ("favourite_list_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favourite_lists_company_idx" ON "favourite_lists" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favourite_lists_user_idx" ON "favourite_lists" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_unique" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_order_current_unique" ON "invoices" USING btree ("order_id") WHERE "invoices"."is_current" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_buyer_company_idx" ON "invoices" USING btree ("buyer_company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_provider_type_received_idx" ON "webhook_events" USING btree ("provider","event_type","received_at" desc);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_signature_verified_idx" ON "webhook_events" USING btree ("signature_verified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx" ON "webhook_events" USING btree ("processed_at");