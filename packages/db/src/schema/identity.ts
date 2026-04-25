import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import {
  localeEnum,
  roleScopeEnum,
  joinRequestStatusEnum,
} from "./_enums";

/**
 * Companies — tenant root. One per customer organization.
 * `email_domain` supports smart company detection on signup.
 * `approval_threshold_halalas` = 0 means no approval needed; > 0 means orders
 *   at or above the threshold require approval.
 */
export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    legalNameAr: text("legal_name_ar"),
    legalNameEn: text("legal_name_en"),
    crNumber: text("cr_number"),
    vatNumber: text("vat_number"),
    emailDomain: text("email_domain"),
    logoUrl: text("logo_url"),
    defaultLocale: localeEnum("default_locale").notNull().default("ar"),
    poRequiredAtCheckout: boolean("po_required_at_checkout")
      .notNull()
      .default(false),
    approvalThresholdHalalas: integer("approval_threshold_halalas")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("companies_email_domain_unique")
      .on(t.emailDomain)
      .where(sql`${t.emailDomain} is not null`),
    index("companies_vat_idx").on(t.vatNumber),
    check(
      "companies_approval_threshold_non_negative",
      sql`${t.approvalThresholdHalalas} >= 0`,
    ),
  ],
);

/**
 * Departments — tree under a company. Self-referential parent.
 */
export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    parentDepartmentId: uuid("parent_department_id"),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("departments_company_parent_idx").on(t.companyId, t.parentDepartmentId),
    foreignKey({
      columns: [t.parentDepartmentId],
      foreignColumns: [t.id],
      name: "departments_parent_fk",
    }).onDelete("set null"),
  ],
);

/**
 * Branches — physical locations under a company, optionally under a department.
 * `address_id` points to the physical address (FK added via migration after
 * addresses table exists to avoid circular import ordering).
 */
export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    addressId: uuid("address_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("branches_company_idx").on(t.companyId)],
);

/**
 * Users — profile extension of auth.users (Supabase).
 * `id` must match auth.users.id. Trigger `on_auth_user_created` inserts a row
 * on signup (defined in Phase 3b SQL migration).
 * `email_verified_at` is mirrored from auth.users.email_confirmed_at via
 * trigger so RLS policies can reference it without cross-schema reads.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullNameAr: text("full_name_ar"),
  fullNameEn: text("full_name_en"),
  phone: text("phone"),
  locale: localeEnum("locale").notNull().default("ar"),
  activeCompanyId: uuid("active_company_id"),
  activeVendorId: uuid("active_vendor_id"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Roles — system seeds (Admin, Approver, Requester) where `company_id is null`
 * and `is_system = true`; companies can define custom roles scoped to
 * themselves.
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    displayNameAr: text("display_name_ar").notNull(),
    displayNameEn: text("display_name_en").notNull(),
    scope: roleScopeEnum("scope").notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("roles_company_name_unique").on(t.companyId, t.name)],
);

/**
 * Role permissions — keys like 'orders.approve', 'users.invite',
 * 'products.browse', 'admin.manage_roles'.
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionKey] })],
);

/**
 * Company memberships — the join table that enables multi-company membership.
 * A single user can belong to multiple companies; active company is in JWT.
 */
export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    isActive: boolean("is_active").notNull().default(true),
    invitedBy: uuid("invited_by").references(() => users.id),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("company_members_user_company_unique").on(
      t.userId,
      t.companyId,
    ),
    index("company_members_company_active_idx").on(t.companyId, t.isActive),
  ],
);

/**
 * Join requests — queue for users requesting to join an existing company
 * detected via email domain match.
 */
export const companyJoinRequests = pgTable(
  "company_join_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    message: text("message"),
    status: joinRequestStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("company_join_requests_company_status_idx").on(t.companyId, t.status),
    uniqueIndex("company_join_requests_pending_unique")
      .on(t.userId, t.companyId)
      .where(sql`${t.status} = 'pending'`),
  ],
);
