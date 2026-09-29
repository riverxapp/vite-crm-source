import { and, asc, count, desc, eq, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/client";
import { searchColumns, type Page } from "@/db/helpers";
import { activities, companies, contacts, deals, type Activity, type NewActivity } from "@/db/schema";
import { crmConfig } from "@/config/crm";
import { startOfDay } from "@/lib/format";

export type ActivityRow = Activity & {
  companyName: string | null;
  contactName: string | null;
  dealName: string | null;
};

export type ActivityScope = { companyId?: number; contactId?: number; dealId?: number };

const contact = alias(contacts, "activity_contact");

function baseQuery() {
  return db
    .select({
      ...activityColumns,
      companyName: companies.name,
      contactName: sql<string | null>`${contact.firstName} || coalesce(' ' || ${contact.lastName}, '')`,
      dealName: deals.name,
    })
    .from(activities)
    .leftJoin(companies, eq(activities.companyId, companies.id))
    .leftJoin(contact, eq(activities.contactId, contact.id))
    .leftJoin(deals, eq(activities.dealId, deals.id));
}

const activityColumns = {
  id: activities.id,
  type: activities.type,
  subject: activities.subject,
  body: activities.body,
  dueAt: activities.dueAt,
  completedAt: activities.completedAt,
  companyId: activities.companyId,
  contactId: activities.contactId,
  dealId: activities.dealId,
  owner: activities.owner,
  createdAt: activities.createdAt,
  updatedAt: activities.updatedAt,
};

function scopeWhere({ companyId, contactId, dealId }: ActivityScope) {
  return and(
    companyId ? eq(activities.companyId, companyId) : undefined,
    contactId ? eq(activities.contactId, contactId) : undefined,
    dealId ? eq(activities.dealId, dealId) : undefined,
  );
}

/** Timeline for a record: everything linked to it, newest first. */
export async function listTimeline(scope: ActivityScope, limit = 100): Promise<ActivityRow[]> {
  return baseQuery().where(scopeWhere(scope)).orderBy(desc(activities.createdAt)).limit(limit);
}

export async function listRecentActivity(limit = 8): Promise<ActivityRow[]> {
  return baseQuery().where(ne(activities.type, "task")).orderBy(desc(activities.createdAt)).limit(limit);
}

export type TaskView = "open" | "overdue" | "completed" | "all";

export type TaskFilters = ActivityScope & { view?: TaskView; search?: string; page?: number };

function taskWhere({ view = "open", search, ...scope }: TaskFilters) {
  const today = startOfDay(new Date());
  return and(
    eq(activities.type, "task"),
    scopeWhere(scope),
    searchColumns(search, [activities.subject, activities.body]),
    view === "open" ? isNull(activities.completedAt) : undefined,
    view === "overdue" ? and(isNull(activities.completedAt), lt(activities.dueAt, today)) : undefined,
    view === "completed" ? isNotNull(activities.completedAt) : undefined,
  );
}

export async function listTasks(filters: TaskFilters): Promise<Page<ActivityRow>> {
  const where = taskWhere(filters);
  const [rows, [{ total }]] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(
        // Open tasks: soonest due first, undated last. Completed: most recent first.
        filters.view === "completed" ? desc(activities.completedAt) : asc(sql`${activities.dueAt} is null`),
        asc(activities.dueAt),
        desc(activities.createdAt),
      )
      .limit(crmConfig.pageSize)
      .offset((filters.page ?? 0) * crmConfig.pageSize),
    db.select({ total: count() }).from(activities).where(where),
  ]);
  return { rows, total };
}

export async function listUpcomingTasks(limit = 6) {
  return baseQuery()
    .where(and(eq(activities.type, "task"), isNull(activities.completedAt)))
    .orderBy(asc(sql`${activities.dueAt} is null`), asc(activities.dueAt))
    .limit(limit);
}

export async function countOpenTasks() {
  const today = startOfDay(new Date());
  const [row] = await db
    .select({
      open: count(),
      overdue: sql<number>`sum(case when ${activities.dueAt} < ${Math.floor(today.getTime() / 1000)} then 1 else 0 end)`.mapWith(Number),
    })
    .from(activities)
    .where(and(eq(activities.type, "task"), isNull(activities.completedAt)));
  return { open: row?.open ?? 0, overdue: row?.overdue ?? 0 };
}

export async function createActivity(values: NewActivity) {
  const [created] = await db.insert(activities).values(values).returning();
  return created;
}

export async function updateActivity(id: number, values: Partial<NewActivity>) {
  const [updated] = await db.update(activities).set(values).where(eq(activities.id, id)).returning();
  return updated;
}

export async function setTaskCompleted(id: number, completed: boolean) {
  await db
    .update(activities)
    .set({ completedAt: completed ? new Date() : null })
    .where(eq(activities.id, id));
}

export async function deleteActivity(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
}

