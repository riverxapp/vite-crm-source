import { and, count, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { companies, contacts, deals } from "@/db/schema";
import { crmConfig, openStages, wonStageValues } from "@/config/crm";
import { countDealsByStage } from "@/features/deals/api";
import { startOfMonth } from "@/lib/format";
import { countOpenTasks, listRecentActivity, listUpcomingTasks } from "@/features/activities/api";

export async function loadDashboard() {
  const monthStart = startOfMonth(new Date());
  const [[companyCount], [contactCount], byStage, [wonThisMonth], tasks, upcomingTasks, recentActivity] =
    await Promise.all([
      db.select({ value: count() }).from(companies),
      db.select({ value: count() }).from(contacts),
      countDealsByStage(openStages.map((s) => s.value)),
      db
        .select({
          count: count(),
          amountCents: sql<number>`coalesce(sum(${deals.amountCents}), 0)`.mapWith(Number),
        })
        .from(deals)
        .where(and(inArray(deals.stage, wonStageValues), gte(deals.closedAt, monthStart))),
      countOpenTasks(),
      listUpcomingTasks(),
      listRecentActivity(),
    ]);

  const pipeline = openStages.map((stage) => {
    const row = byStage.find((r) => r.stage === stage.value);
    const amountCents = row?.amountCents ?? 0;
    return {
      stage: stage.value,
      label: stage.label,
      count: row?.count ?? 0,
      amountCents,
      weightedCents: Math.round((amountCents * stage.probability) / 100),
    };
  });

  return {
    companies: companyCount.value,
    contacts: contactCount.value,
    openDeals: pipeline.reduce((n, s) => n + s.count, 0),
    openPipelineCents: pipeline.reduce((n, s) => n + s.amountCents, 0),
    weightedPipelineCents: pipeline.reduce((n, s) => n + s.weightedCents, 0),
    wonThisMonth,
    tasks,
    pipeline,
    upcomingTasks,
    recentActivity,
    currency: crmConfig.currency,
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
