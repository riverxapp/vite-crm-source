import { and, count, desc, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { searchColumns, type Option, type Page } from "@/db/helpers";
import { activities, companies, contacts, deals, type Contact, type NewContact } from "@/db/schema";
import { crmConfig } from "@/config/crm";

export type ContactRow = Contact & { companyName: string | null };

export type ContactFilters = { search?: string; status?: string; companyId?: number; page?: number };

const contactWithCompany = { ...getTableColumns(contacts), companyName: companies.name };

export async function listContacts({ search, status, companyId, page = 0 }: ContactFilters): Promise<Page<ContactRow>> {
  const where = and(
    searchColumns(search, [
      contacts.firstName,
      contacts.lastName,
      contacts.email,
      sql`${contacts.firstName} || ' ' || coalesce(${contacts.lastName}, '')`,
    ]),
    status ? eq(contacts.status, status) : undefined,
    companyId ? eq(contacts.companyId, companyId) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(contactWithCompany)
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(where)
      .orderBy(desc(contacts.updatedAt))
      .limit(crmConfig.pageSize)
      .offset(page * crmConfig.pageSize),
    db.select({ total: count() }).from(contacts).where(where),
  ]);
  return { rows, total };
}

export async function listCompanyContacts(companyId: number) {
  return db
    .select(contactWithCompany)
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(eq(contacts.companyId, companyId))
    .orderBy(contacts.firstName)
    .limit(200);
}

export async function getContact(id: number): Promise<ContactRow | null> {
  const row = await db
    .select(contactWithCompany)
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(eq(contacts.id, id))
    .get();
  return row ?? null;
}

export async function searchContactOptions(search: string, companyId?: number | null): Promise<Option[]> {
  return db
    .select({
      id: contacts.id,
      label: sql<string>`${contacts.firstName} || coalesce(' ' || ${contacts.lastName}, '')`,
      hint: contacts.email,
    })
    .from(contacts)
    .where(
      and(
        searchColumns(search, [contacts.firstName, contacts.lastName, contacts.email]),
        companyId ? eq(contacts.companyId, companyId) : undefined,
      ),
    )
    .orderBy(contacts.firstName)
    .limit(20);
}

export async function createContact(values: NewContact) {
  const [created] = await db.insert(contacts).values(values).returning();
  return created;
}

export async function updateContact(id: number, values: Partial<NewContact>) {
  const [updated] = await db.update(contacts).set(values).where(eq(contacts.id, id)).returning();
  return updated;
}

/** Unlinks deals and removes activities that belonged only to this contact. */
export async function deleteContact(id: number) {
  await db.batch([
    db.update(deals).set({ contactId: null }).where(eq(deals.contactId, id)),
    db
      .delete(activities)
      .where(and(eq(activities.contactId, id), isNull(activities.companyId), isNull(activities.dealId))),
    db.update(activities).set({ contactId: null }).where(eq(activities.contactId, id)),
    db.delete(contacts).where(eq(contacts.id, id)),
  ]);
}
