import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { PageHeader } from "@/components/crm/PageHeader";
import { Pager } from "@/components/crm/Pager";
import { SearchInput } from "@/components/crm/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/crm/States";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig } from "@/config/crm";
import { listContacts } from "@/features/contacts/api";
import { ContactFormDialog } from "@/features/contacts/ContactFormDialog";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";
import { formatRelative, fullName, plural } from "@/lib/format";

const { labels } = crmConfig;

export function ContactsPage() {
  const navigate = useNavigate();
  const list = useListParams(["status"] as const);
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, reload } = useAsync(
    () => listContacts({ search: list.search, status: list.filters.status, page: list.page }),
    [list.search, list.filters.status, list.page],
  );

  const hasFilters = Boolean(list.search || list.filters.status);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={labels.contact.plural}
        description={<span className="font-mono text-xs">{data ? `${plural(data.total, "record")}` : "\u00a0"}</span>}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New {labels.contact.singular.toLowerCase()}
          </Button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search by name or email…" />
          <OptionSelect
            kind="filter"
            options={crmConfig.contactStatuses}
            value={list.filters.status}
            onChange={(v) => list.setFilter("status", v)}
            emptyLabel="All statuses"
          />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.rows.length ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? "No matches" : `No ${labels.contact.plural.toLowerCase()} yet`}
            description={hasFilters ? "Try a different search or filter." : "Add the people you work with."}
            action={
              hasFilters ? null : (
                <Button onClick={() => setCreating(true)}>
                  <Plus />
                  New {labels.contact.singular.toLowerCase()}
                </Button>
              )
            }
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.company.singular}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/app/contacts/${p.id}`)}>
                      <TableCell>
                        <Link to={`/app/contacts/${p.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                          {fullName(p)}
                        </Link>
                        {p.jobTitle ? <div className="text-xs text-muted-foreground">{p.jobTitle}</div> : null}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{p.email || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {p.companyId ? (
                          <Link to={`/app/companies/${p.companyId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                            {p.companyName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ToneBadge options={crmConfig.contactStatuses} value={p.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{p.phone || "—"}</TableCell>
                      <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">{formatRelative(p.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Pager page={list.page} total={data.total} onPageChange={list.setPage} />
          </>
        )}
      </div>
      <ContactFormDialog open={creating} onOpenChange={setCreating} onSaved={(c) => navigate(`/app/contacts/${c.id}`)} />
    </>
  );
}
