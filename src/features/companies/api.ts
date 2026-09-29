import { and, count, desc, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { searchColumns, type Option, type Page } from "@/db/helpers";
import { activities, companies, contacts, deals, type Company, type NewCompany } from "@/db/schema";
import { crmConfig, openStageValues } from "@/config/crm";

export type CompanyRow = Company & { contactCount: number; openDealCents: number };

export type CompanyFilters = { search?: string; lifecycle?: string; page?: number };

const openStagesSql = sql.join(
  openStageValues.map((s) => sql`${s}`),
  sql`, `,
);

export async function listCompanies({ search, lifecycle, page = 0 }: CompanyFilters): Promise<Page<CompanyRow>> {
  const where = and(
    searchColumns(search, [companies.name, companies.domain, companies.city]),
    lifecycle ? eq(companies.lifecycle, lifecycle) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        ...getTableColumns(companies),
        contactCount: sql<number>`(select count(*) from contacts c where c.company_id = "companies"."id")`.mapWith(Number),
        openDealCents: sql<number>`(select coalesce(sum(d.amount_cents), 0) from deals d where d.company_id = "companies"."id" and d.stage in (${openStagesSql}))`.mapWith(Number),
      })
      .from(companies)
      .where(where)
      .orderBy(desc(companies.updatedAt))
      .limit(crmConfig.pageSize)
      .offset(page * crmConfig.pageSize),
    db.select({ total: count() }).from(companies).where(where),
  ]);
  return { rows, total };
}

export async function getCompany(id: number) {
  const company = await db.select().from(companies).where(eq(companies.id, id)).get();
  return company ?? null;
}

export async function searchCompanyOptions(search: string): Promise<Option[]> {
  const rows = await db
    .select({ id: companies.id, label: companies.name, hint: companies.domain })
    .from(companies)
    .where(searchColumns(search, [companies.name, companies.domain]))
    .orderBy(companies.name)
    .limit(20);
  return rows;
}

export async function createCompany(values: NewCompany) {
  const [created] = await db.insert(companies).values(values).returning();
  return created;
}

export async function updateCompany(id: number, values: Partial<NewCompany>) {
  const [updated] = await db.update(companies).set(values).where(eq(companies.id, id)).returning();
  return updated;
}

/** Unlinks contacts and deals, removes activities that belonged only to this company. */
export async function deleteCompany(id: number) {
  await db.batch([
    db.update(contacts).set({ companyId: null }).where(eq(contacts.companyId, id)),
    db.update(deals).set({ companyId: null }).where(eq(deals.companyId, id)),
    db
      .delete(activities)
      .where(and(eq(activities.companyId, id), isNull(activities.contactId), isNull(activities.dealId))),
    db.update(activities).set({ companyId: null }).where(eq(activities.companyId, id)),
    db.delete(companies).where(eq(companies.id, id)),
  ]);
}

