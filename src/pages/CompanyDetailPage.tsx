import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Globe, Plus } from "@/components/icons";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailItem } from "@/components/crm/Field";
import { PageHeader } from "@/components/crm/PageHeader";
import { RecordHeaderActions } from "@/components/crm/RecordHeaderActions";
import { RecordNotFound } from "@/components/crm/RecordNotFound";
import { ErrorState } from "@/components/crm/States";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig, optionLabel } from "@/config/crm";
import { ActivityPanel } from "@/features/activities/ActivityPanel";
import { deleteCompany, getCompany } from "@/features/companies/api";
import { CompanyFormDialog } from "@/features/companies/CompanyFormDialog";
import { listCompanyContacts } from "@/features/contacts/api";
import { ContactFormDialog } from "@/features/contacts/ContactFormDialog";
import { listRelatedDeals } from "@/features/deals/api";
import { DealFormDialog } from "@/features/deals/DealFormDialog";
import { DealList } from "@/features/deals/DealList";
import { useAsync } from "@/hooks/use-async";
import { formatDate, formatMoney, fullName } from "@/lib/format";

const { labels } = crmConfig;

export function CompanyDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "contact" | "deal" | null>(null);

  const company = useAsync(() => getCompany(id), [id]);
  const contacts = useAsync(() => listCompanyContacts(id), [id]);
  const deals = useAsync(() => listRelatedDeals({ companyId: id }), [id]);

  const c = company.data;
  const link = useMemo(() => (c ? { id: c.id, label: c.name } : null), [c]);

  if (company.error) return <div className="p-6"><ErrorState error={company.error} onRetry={company.reload} /></div>;
  if (company.loading && !c) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!c) return <RecordNotFound label={labels.company.singular} backTo="/app/companies" backLabel={`Back to ${labels.company.plural.toLowerCase()}`} />;

  const openDealTotal = (deals.data ?? [])
    .filter((d) => crmConfig.dealStages.find((s) => s.value === d.stage)?.kind === "open")
    .reduce((n, d) => n + d.amountCents, 0);

  async function remove() {
    try {
      await deleteCompany(id);
      toast.success(`${labels.company.singular} deleted`);
      navigate("/app/companies");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/companies" className="hover:text-foreground">{labels.company.plural}</Link>
            <span className="px-1.5">/</span>#{c.id}
          </span>
        }
        title={c.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ToneBadge options={crmConfig.companyLifecycles} value={c.lifecycle} />
            {c.industry ? <span>{optionLabel(crmConfig.industries, c.industry)}</span> : null}
            {c.domain ? <span className="font-mono text-xs">{c.domain}</span> : null}
          </span>
        }
        actions={
          <RecordHeaderActions
            entityLabel={labels.company.singular}
            name={c.name}
            deleteDescription={`Its ${labels.contact.plural.toLowerCase()} and ${labels.deal.plural.toLowerCase()} are kept but unlinked. This can’t be undone.`}
            onEdit={() => setDialog("edit")}
            onDelete={remove}
          />
        }
      />

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailItem label="Website">
                  {c.website ? (
                    <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline">
                      <Globe className="h-3.5 w-3.5" />
                      {c.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                </DetailItem>
                <DetailItem label="Phone">{c.phone}</DetailItem>
                <DetailItem label="Size">{optionLabel(crmConfig.companySizes, c.size)}</DetailItem>
                <DetailItem label="Address">{[c.address, c.city, c.country].filter(Boolean).join(", ")}</DetailItem>
                <DetailItem label="Owner">{c.owner}</DetailItem>
                <DetailItem label="Open pipeline">{openDealTotal ? formatMoney(openDealTotal) : null}</DetailItem>
                <DetailItem label="Created">{formatDate(c.createdAt)}</DetailItem>
              </dl>
              {c.description ? <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">{c.description}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{labels.contact.plural} ({contacts.data?.length ?? 0})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setDialog("contact")}><Plus />Add</Button>
            </CardHeader>
            <CardContent className="p-0">
              {contacts.data?.length ? (
                <ul className="divide-y">
                  {contacts.data.map((p) => (
                    <li key={p.id}>
                      <Link to={`/app/contacts/${p.id}`} className="block px-4 py-3 hover:bg-accent">
                        <p className="text-sm font-medium">{fullName(p)}</p>
                        <p className="truncate font-mono text-[0.72rem] text-muted-foreground">{[p.jobTitle, p.email].filter(Boolean).join(" · ") || "—"}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-sm text-muted-foreground">No {labels.contact.plural.toLowerCase()} yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="deals">{labels.deal.plural} ({deals.data?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="mt-4">
            <ActivityPanel scope={{ companyId: id }} timelineScope={{ companyId: id }} taskLinks={{ company: link }} />
          </TabsContent>
          <TabsContent value="deals" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{labels.deal.plural}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setDialog("deal")}><Plus />Add</Button>
              </CardHeader>
              <CardContent className="p-0">
                {deals.data?.length ? <DealList deals={deals.data} /> : <p className="px-4 py-4 text-sm text-muted-foreground">No {labels.deal.plural.toLowerCase()} yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CompanyFormDialog open={dialog === "edit"} onOpenChange={(o) => setDialog(o ? "edit" : null)} company={c} onSaved={company.reload} />
      <ContactFormDialog open={dialog === "contact"} onOpenChange={(o) => setDialog(o ? "contact" : null)} defaultCompany={link} onSaved={contacts.reload} />
      <DealFormDialog open={dialog === "deal"} onOpenChange={(o) => setDialog(o ? "deal" : null)} defaults={{ company: link }} onSaved={deals.reload} />
    </>
  );
}
