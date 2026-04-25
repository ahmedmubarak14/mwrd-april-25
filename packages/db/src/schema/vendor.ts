import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { vendorStatusEnum, vendorUserRoleEnum } from "./_enums";
import { users } from "./identity";

/**
 * Vendors — suppliers. Isolated from `companies`; suppliers aren't tenants of
 * buyer-side data. Go-live requires `cr_verified_at is not null` and
 * `status = 'active'`.
 */
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  legalNameAr: text("legal_name_ar").notNull(),
  legalNameEn: text("legal_name_en").notNull(),
  displayNameAr: text("display_name_ar").notNull(),
  displayNameEn: text("display_name_en").notNull(),
  crNumber: text("cr_number").notNull(),
  crVerifiedAt: timestamp("cr_verified_at", { withTimezone: true }),
  vatNumber: text("vat_number"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  logoUrl: text("logo_url"),
  status: vendorStatusEnum("status").notNull().default("pending_verification"),
  bankAccountIban: text("bank_account_iban"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Vendor users — supplier-side membership. A single user can belong to
 * multiple vendors; `active_vendor_id` JWT claim picks which one is in scope.
 */
export const vendorUsers = pgTable(
  "vendor_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    role: vendorUserRoleEnum("role").notNull().default("staff"),
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("vendor_users_user_vendor_unique").on(t.userId, t.vendorId)],
);
