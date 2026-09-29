import { and, count, desc, eq, getTableColumns, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/client";
import { searchColumns, type Option, type Page } from "@/db/helpers";
import { activities, companies, contacts, deals, type Deal, type NewDeal } from "@/db/schema";
import { crmConfig, getStage } from "@/config/crm";

export type DealRow = Deal & { companyName: string | null; contactName: string | null };

export type DealFilters = {
  search?: string;
  stage?: string;
  companyId?: number;
  contactId?: number;
  page?: number;
};

const contact = alias(contacts, "deal_contact");

const dealWithNames = {
  ...getTableColumns(deals),
  companyName: companies.name,
  contactName: sql<string | null>`${contact.firstName} || coalesce(' ' || ${contact.lastName}, '')`,
};

function baseQuery() {
  return db
    .select(dealWithNames)
    .from(deals)
    .leftJoin(companies, eq(deals.companyId, companies.id))
    .leftJoin(contact, eq(deals.contactId, contact.id));
}

function filtersToWhere({ search, stage, companyId, contactId }: DealFilters) {
  return and(
    searchColumns(search, [deals.name]),
    stage ? eq(deals.stage, stage) : undefined,
    companyId ? eq(deals.companyId, companyId) : undefined,
    contactId ? eq(deals.contactId, contactId) : undefined,
  );
}

export async function listDeals(filters: DealFilters): Promise<Page<DealRow>> {
  const where = filtersToWhere(filters);
  const [rows, [{ total }]] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(desc(deals.updatedAt))
      .limit(crmConfig.pageSize)
      .offset((filters.page ?? 0) * crmConfig.pageSize),
    db.select({ total: count() }).from(deals).where(where),
  ]);
  return { rows, total };
}

/** Board view: up to 200 most recently updated deals per stage. */
export async function listDealsForBoard(search?: string) {
  const perStage = await Promise.all(
    crmConfig.dealStages.map((stage) =>
      baseQuery()
        .where(filtersToWhere({ search, stage: stage.value }))
        .orderBy(desc(deals.updatedAt))
        .limit(200),
    ),
  );
  return perStage.flat();
}

export async function listRelatedDeals(filters: Pick<DealFilters, "companyId" | "contactId">) {
  return baseQuery().where(filtersToWhere(filters)).orderBy(desc(deals.updatedAt)).limit(200);
}

export async function getDeal(id: number): Promise<DealRow | null> {
  const row = await baseQuery().where(eq(deals.id, id)).get();
  return row ?? null;
}

export async function searchDealOptions(search: string): Promise<Option[]> {
  return db
    .select({ id: deals.id, label: deals.name, hint: companies.name })
    .from(deals)
    .leftJoin(companies, eq(deals.companyId, companies.id))
    .where(searchColumns(search, [deals.name]))
    .orderBy(desc(deals.updatedAt))
    .limit(20);
}

function closedAtFor(stage: string) {
  const kind = getStage(stage)?.kind;
  return kind === "won" || kind === "lost" ? new Date() : null;
}

export async function createDeal(values: NewDeal) {
  const [created] = await db
    .insert(deals)
    .values({ ...values, closedAt: closedAtFor(values.stage) })
    .returning();
  return created;
}

export async function updateDeal(id: number, values: Partial<NewDeal>, previousStage?: string) {
  const patch = { ...values };
  if (values.stage && values.stage !== previousStage) patch.closedAt = closedAtFor(values.stage);
  const [updated] = await db.update(deals).set(patch).where(eq(deals.id, id)).returning();
  return updated;
}

export async function moveDealToStage(id: number, stage: string) {
  await db.update(deals).set({ stage, closedAt: closedAtFor(stage) }).where(eq(deals.id, id));
}

/** Removes activities that belonged only to this deal and unlinks the rest. */
export async function deleteDeal(id: number) {
  await db.batch([
    db
      .delete(activities)
      .where(and(eq(activities.dealId, id), isNull(activities.companyId), isNull(activities.contactId))),
    db.update(activities).set({ dealId: null }).where(eq(activities.dealId, id)),
    db.delete(deals).where(eq(deals.id, id)),
  ]);
}

export async function countDealsByStage(stages: string[]) {
  return db
    .select({
      stage: deals.stage,
      count: count(),
      amountCents: sql<number>`coalesce(sum(${deals.amountCents}), 0)`.mapWith(Number),
    })
    .from(deals)
    .where(inArray(deals.stage, stages))
    .groupBy(deals.stage);
}
