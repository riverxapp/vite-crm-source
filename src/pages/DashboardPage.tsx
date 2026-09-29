import { Link } from "react-router-dom";
import { Building2, CheckSquare, Handshake, Trophy, Users, type IconComponent } from "@/components/icons";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/crm/PageHeader";
import { ErrorState } from "@/components/crm/States";
import { crmConfig } from "@/config/crm";
import { setTaskCompleted } from "@/features/activities/api";
import { activityIcons } from "@/features/activities/activity-meta";
import { TaskItem } from "@/features/activities/TaskItem";
import { loadDashboard } from "@/features/dashboard/api";
import { PipelineChart } from "@/features/dashboard/PipelineChart";
import { useAuth } from "@/features/auth/use-auth";
import { useAsync } from "@/hooks/use-async";
import { formatMoneyCompact, formatRelative } from "@/lib/format";

const { labels } = crmConfig;

type StatProps = { label: string; value: string; hint?: string; icon: IconComponent; to: string };

function Stat({ label, value, hint, icon: Icon, to }: StatProps) {
  return (
    <Link
      to={to}
      className="flex items-start justify-between gap-3 bg-card p-4 transition-colors [transition-duration:120ms] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="min-w-0 space-y-1.5">
        <p className="rx-meta">{label}</p>
        <p className="font-mono text-[1.6rem] font-semibold leading-none tabular-nums tracking-tight">{value}</p>
        {hint ? <p className="truncate font-mono text-[0.72rem] text-muted-foreground">{hint}</p> : null}
      </div>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(loadDashboard, []);

  async function toggle(id: number, done: boolean) {
    try {
      await setTaskCompleted(id, done);
      reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard" description={user ? `Welcome back, ${user.name.split(" ")[0]}.` : undefined} />
      <div className="space-y-6 p-4 sm:p-6">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-none" />)}
            <Skeleton className="h-80 rounded-none sm:col-span-2 xl:col-span-3" />
            <Skeleton className="h-80 rounded-none" />
          </div>
        ) : data ? (
          <>
            <div className="grid gap-px border bg-[var(--rule)] sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Open pipeline"
                value={formatMoneyCompact(data.openPipelineCents)}
                hint={`${data.openDeals} open ${labels.deal.plural.toLowerCase()} · ${formatMoneyCompact(data.weightedPipelineCents)} weighted`}
                icon={Handshake}
                to="/app/deals"
              />
              <Stat
                label="Won this month"
                value={formatMoneyCompact(data.wonThisMonth?.amountCents ?? 0)}
                hint={`${data.wonThisMonth?.count ?? 0} ${labels.deal.plural.toLowerCase()} closed`}
                icon={Trophy}
                to="/app/deals?view=list&stage=won"
              />
              <Stat
                label={labels.company.plural}
                value={data.companies.toLocaleString()}
                hint={`${data.contacts.toLocaleString()} ${labels.contact.plural.toLowerCase()}`}
                icon={Building2}
                to="/app/companies"
              />
              <Stat
                label={`Open ${labels.task.plural.toLowerCase()}`}
                value={data.tasks.open.toLocaleString()}
                hint={data.tasks.overdue ? `${data.tasks.overdue} overdue` : "Nothing overdue"}
                icon={CheckSquare}
                to={data.tasks.overdue ? "/app/tasks?view=overdue" : "/app/tasks"}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Open pipeline by stage</CardTitle>
                  <Button asChild variant="bracket">
                    <Link to="/app/deals">Open board</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  {data.openDeals ? (
                    <PipelineChart pipeline={data.pipeline} />
                  ) : (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
                      <Handshake className="h-5 w-5" />
                      No open {labels.deal.plural.toLowerCase()} yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Upcoming {labels.task.plural.toLowerCase()}</CardTitle>
                  <Button asChild variant="bracket">
                    <Link to="/app/tasks">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {data.upcomingTasks.length ? (
                    <div className="divide-y">
                      {data.upcomingTasks.map((t) => (
                        <TaskItem key={t.id} task={t} onToggle={(task, done) => void toggle(task.id, done)} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-4 text-sm text-muted-foreground">You’re all caught up.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentActivity.length ? (
                  <ul className="divide-y">
                    {data.recentActivity.map((a) => {
                      const Icon = activityIcons[a.type] ?? activityIcons.note;
                      const target = a.dealId
                        ? { to: `/app/deals/${a.dealId}`, label: a.dealName }
                        : a.contactId
                          ? { to: `/app/contacts/${a.contactId}`, label: a.contactName }
                          : a.companyId
                            ? { to: `/app/companies/${a.companyId}`, label: a.companyName }
                            : null;
                      return (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border bg-muted">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.subject}</p>
                            <p className="truncate font-mono text-[0.72rem] text-muted-foreground">
                              {target ? (
                                <Link to={target.to} className="hover:text-foreground hover:underline">{target.label}</Link>
                              ) : null}
                              {target ? " · " : ""}
                              {formatRelative(a.createdAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4 pb-6 pt-2 text-center text-sm text-muted-foreground">
                    <Users className="h-5 w-5" />
                    Calls, emails, meetings and notes you log on records appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}
