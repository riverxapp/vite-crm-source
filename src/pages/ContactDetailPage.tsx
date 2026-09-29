import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mail, Phone, Plus } from "@/components/icons";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailItem } from "@/components/crm/Field";
import { PageHeader } from "@/components/crm/PageHeader";
import { RecordHeaderActions } from "@/components/crm/RecordHeaderActions";
import { RecordNotFound } from "@/components/crm/RecordNotFound";
import { ErrorState } from "@/components/crm/States";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig } from "@/config/crm";
import { ActivityPanel } from "@/features/activities/ActivityPanel";
import { deleteContact, getContact } from "@/features/contacts/api";
import { ContactFormDialog } from "@/features/contacts/ContactFormDialog";
import { listRelatedDeals } from "@/features/deals/api";
import { DealFormDialog } from "@/features/deals/DealFormDialog";
import { DealList } from "@/features/deals/DealList";
import { useAsync } from "@/hooks/use-async";
import { formatDate, fullName } from "@/lib/format";

const { labels } = crmConfig;

export function ContactDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "deal" | null>(null);

  const contact = useAsync(() => getContact(id), [id]);
  const deals = useAsync(() => listRelatedDeals({ contactId: id }), [id]);
  const p = contact.data;

  const links = useMemo(
    () => ({
      contact: p ? { id: p.id, label: fullName(p) } : null,
      company: p?.companyId ? { id: p.companyId, label: p.companyName ?? "" } : null,
    }),
    [p],
  );

  if (contact.error) return <div className="p-6"><ErrorState error={contact.error} onRetry={contact.reload} /></div>;
  if (contact.loading && !p) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  if (!p) return <RecordNotFound label={labels.contact.singular} backTo="/app/contacts" backLabel={`Back to ${labels.contact.plural.toLowerCase()}`} />;

  const name = fullName(p);

  async function remove() {
    try {
      await deleteContact(id);
      toast.success(`${labels.contact.singular} deleted`);
      navigate("/app/contacts");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/app/contacts" className="hover:text-foreground">{labels.contact.plural}</Link>
            <span className="px-1.5">/</span>#{p.id}
          </span>
        }
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ToneBadge options={crmConfig.contactStatuses} value={p.status} />
            {p.jobTitle ? <span>{p.jobTitle}</span> : null}
            {p.companyId ? (
              <>
                <span>at</span>
                <Link to={`/app/companies/${p.companyId}`} className="font-medium text-foreground hover:underline">
                  {p.companyName}
                </Link>
              </>
            ) : null}
          </span>
        }
        actions={
          <RecordHeaderActions
            entityLabel={labels.contact.singular}
            name={name}
            deleteDescription={`Linked ${labels.deal.plural.toLowerCase()} are kept but unlinked. This can’t be undone.`}
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
                <DetailItem label="Email">
                  {p.email ? (
                    <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline">
                      <Mail className="h-3.5 w-3.5" />
                      {p.email}
                    </a>
                  ) : null}
                </DetailItem>
                <DetailItem label="Phone">
                  {p.phone ? (
                    <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 font-mono text-xs hover:underline">
                      <Phone className="h-3.5 w-3.5" />
                      {p.phone}
                    </a>
                  ) : null}
                </DetailItem>
                <DetailItem label="Owner">{p.owner}</DetailItem>
                <DetailItem label="Created">{formatDate(p.createdAt)}</DetailItem>
              </dl>
              {p.notes ? <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">{p.notes}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{labels.deal.plural} ({deals.data?.length ?? 0})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setDialog("deal")}><Plus />Add</Button>
            </CardHeader>
            <CardContent className="p-0">
              {deals.data?.length ? <DealList deals={deals.data} /> : <p className="px-4 py-4 text-sm text-muted-foreground">No {labels.deal.plural.toLowerCase()} yet.</p>}
            </CardContent>
          </Card>
        </div>

        <ActivityPanel
          scope={{ contactId: id, companyId: p.companyId ?? undefined }}
          timelineScope={{ contactId: id }}
          taskLinks={links}
        />
      </div>

      <ContactFormDialog open={dialog === "edit"} onOpenChange={(o) => setDialog(o ? "edit" : null)} contact={p} onSaved={contact.reload} />
      <DealFormDialog open={dialog === "deal"} onOpenChange={(o) => setDialog(o ? "deal" : null)} defaults={links} onSaved={deals.reload} />
    </>
  );
}
