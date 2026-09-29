import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

// Option values (lifecycle, status, stage, type) are plain text keys.
// Their labels and meaning live in src/config/crm.ts, so no seed data is needed.

export const companies = sqliteTable(
  "companies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    domain: text("domain"),
    industry: text("industry"),
    size: text("size"),
    lifecycle: text("lifecycle").notNull().default("lead"),
    phone: text("phone"),
    website: text("website"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    owner: text("owner"),
    description: text("description"),
    ...timestamps,
  },
  (t) => [index("companies_name_idx").on(t.name), index("companies_lifecycle_idx").on(t.lifecycle)],
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    jobTitle: text("job_title"),
    companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
    status: text("status").notNull().default("active"),
    owner: text("owner"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("contacts_company_idx").on(t.companyId), index("contacts_name_idx").on(t.firstName, t.lastName)],
);

export const deals = sqliteTable(
  "deals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
    contactId: integer("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    // Minor currency units (e.g. cents) to avoid float rounding.
    amountCents: integer("amount_cents").notNull().default(0),
    stage: text("stage").notNull(),
    expectedCloseDate: integer("expected_close_date", { mode: "timestamp" }),
    closedAt: integer("closed_at", { mode: "timestamp" }),
    owner: text("owner"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("deals_company_idx").on(t.companyId),
    index("deals_contact_idx").on(t.contactId),
    index("deals_stage_idx").on(t.stage),
  ],
);

// Notes, calls, emails, meetings and tasks share one timeline table.
// Tasks use dueAt / completedAt; other types usually leave them empty.
export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type").notNull(),
    subject: text("subject").notNull(),
    body: text("body"),
    dueAt: integer("due_at", { mode: "timestamp" }),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
    contactId: integer("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    dealId: integer("deal_id").references(() => deals.id, { onDelete: "set null" }),
    owner: text("owner"),
    ...timestamps,
  },
  (t) => [
    index("activities_company_idx").on(t.companyId),
    index("activities_contact_idx").on(t.contactId),
    index("activities_deal_idx").on(t.dealId),
    index("activities_type_due_idx").on(t.type, t.dueAt),
  ],
);

// Auth tables. Read and written ONLY by the server auth API (server/auth.ts).
// The browser Data API proxy rejects any SQL that references auth_* tables —
// never query them from src/.
export const authUsers = sqliteTable(
  "auth_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("auth_users_email_idx").on(t.email)],
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    // SHA-256 of the session token; the token itself only lives in the cookie.
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("auth_sessions_user_idx").on(t.userId)],
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
