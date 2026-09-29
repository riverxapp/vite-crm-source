import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailItem } from "@/components/crm/Field";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { PageHeader } from "@/components/crm/PageHeader";
import { RecordHeaderActions } from "@/components/crm/RecordHeaderActions";
import { RecordNotFound } from "@/components/crm/RecordNotFound";
import { ErrorState } from "@/components/crm/States";
import { crmConfig, getStage } from "@/config/crm";
import { ActivityPanel } from "@/features/activities/ActivityPanel";
import { deleteDeal, getDeal, moveDealToStage } from "@/features/deals/api";
import { DealFormDialog } from "@/features/deals/DealFormDialog";
import { useAsync } from "@/hooks/use-async";
import { formatDate, formatMoney, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";

const { labels } = crmConfig;

export function DealDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const deal = useAsync(() => getDeal(id), [id]);
  const d = deal.data;

  const links = useMemo(
    () => ({
      deal: d ? { id: d.id, label: d.name } : null,
      company: d?.companyId ? { id: d.companyId, label: d.companyName ?? "" } : null,
      contact: d?.contactId ? { id: d.contactId, label: d.contactName ?? "" } : null,
    }),
    [d],
  );

  if (deal.error) return <div className="p-6"><ErrorState error={deal.error} onRetry={deal.reload} /></div>;
  if (deal.loading && !d) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!d) return <RecordNotFound label={labels.deal.singular} backTo="/app/deals" backLabel={`Back to ${labels.deal.plural.toLowerCase()}`} />;

  const stage = getStage(d.stage);

  async function changeStage(value: string) {
    try {
      await moveDealToStage(id, value);
      toast.success(`Moved to ${getStage(value)?.label ?? value}`);
      deal.reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function remove() {
    try {
      await deleteDeal(id);
      toast.success(`${labels.deal.singular} deleted`);
      navigate("/app/deals");
    } catch (e) {
      toast.error(String(e));
    }
  }

  const currentIndex = crmConfig.dealStages.findIndex((s) => s.value === d.stage);

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/deals" className="hover:text-foreground">{labels.deal.plural}</Link>
            <span className="px-1.5">/</span>#{d.id}
          </span>
        }
        title={d.name}
        description={
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums">{formatMoney(d.amountCents)}</span>
            {d.companyId ? (
              <>
                <span>·</span>
                <Link to={`/app/companies/${d.companyId}`} className="hover:underline">{d.companyName}</Link>
              </>
            ) : null}
          </span>
        }
        actions={
          <>
            <OptionSelect options={crmConfig.dealStages} value={d.stage} onChange={changeStage} className="w-40" />
            <RecordHeaderActions
              entityLabel={labels.deal.singular}
              name={d.name}
              deleteDescription="Activities logged only on this deal are deleted too. This can’t be undone."
              onEdit={() => setEditing(true)}
              onDelete={remove}
            />
          </>
        }
      >
        <ol className="mt-3 flex max-w-2xl gap-1" aria-label="Stage progress">
          {crmConfig.dealStages.filter((s) => s.kind === "open" || s.value === d.stage).map((s) => {
            const index = crmConfig.dealStages.indexOf(s);
            const reached = stage?.kind === "won" || index <= currentIndex;
            return (
              <li key={s.value} className="flex-1" title={s.label}>
                <div
                  className={cn(
                    "h-1 bg-secondary",
                    reached && "bg-primary",
                    s.value === d.stage && stage?.kind === "lost" && "bg-destructive",
                    s.value === d.stage && stage?.kind === "won" && "bg-success",
                  )}
                />
                <span className={cn("mt-1.5 block truncate font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground", s.value === d.stage && "font-medium text-foreground")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </PageHeader>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card className="h-fit">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl>
              <DetailItem label={labels.company.singular}>
                {d.companyId ? <Link to={`/app/companies/${d.companyId}`} className="text-brand hover:underline">{d.companyName}</Link> : null}
              </DetailItem>
              <DetailItem label={labels.contact.singular}>
                {d.contactId ? <Link to={`/app/contacts/${d.contactId}`} className="text-brand hover:underline">{d.contactName}</Link> : null}
              </DetailItem>
              <DetailItem label="Probability">{stage ? `${stage.probability}%` : null}</DetailItem>
              <DetailItem label="Expected close">
                {d.expectedCloseDate ? (
                  <span className={cn(stage?.kind === "open" && isOverdue(d.expectedCloseDate) && "text-destructive")}>{formatDate(d.expectedCloseDate)}</span>
                ) : null}
              </DetailItem>
              {d.closedAt ? <DetailItem label="Closed">{formatDate(d.closedAt)}</DetailItem> : null}
              <DetailItem label="Owner">{d.owner}</DetailItem>
              <DetailItem label="Created">{formatDate(d.createdAt)}</DetailItem>
            </dl>
            {d.notes ? <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">{d.notes}</p> : null}
          </CardContent>
        </Card>

        <ActivityPanel
          scope={{ dealId: id, companyId: d.companyId ?? undefined, contactId: d.contactId ?? undefined }}
          timelineScope={{ dealId: id }}
          taskLinks={links}
        />
      </div>

      <DealFormDialog open={editing} onOpenChange={setEditing} deal={d} onSaved={deal.reload} />
    </>
  );
}
