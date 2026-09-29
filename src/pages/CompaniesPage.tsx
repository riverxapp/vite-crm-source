import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { PageHeader } from "@/components/crm/PageHeader";
import { Pager } from "@/components/crm/Pager";
import { SearchInput } from "@/components/crm/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/crm/States";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig, optionLabel } from "@/config/crm";
import { listCompanies } from "@/features/companies/api";
import { CompanyFormDialog } from "@/features/companies/CompanyFormDialog";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";
import { formatMoney, formatRelative, plural } from "@/lib/format";

const { labels } = crmConfig;

export function CompaniesPage() {
  const navigate = useNavigate();
  const list = useListParams(["lifecycle"] as const);
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, reload } = useAsync(
    () => listCompanies({ search: list.search, lifecycle: list.filters.lifecycle, page: list.page }),
    [list.search, list.filters.lifecycle, list.page],
  );

  const hasFilters = Boolean(list.search || list.filters.lifecycle);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={labels.company.plural}
        description={<span className="font-mono text-xs">{data ? `${plural(data.total, "record")}` : "\u00a0"}</span>}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New {labels.company.singular.toLowerCase()}
          </Button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={searchText} onChange={setSearchText} placeholder={`Search ${labels.company.plural.toLowerCase()}…`} />
          <OptionSelect
            kind="filter"
            options={crmConfig.companyLifecycles}
            value={list.filters.lifecycle}
            onChange={(v) => list.setFilter("lifecycle", v)}
            emptyLabel="All lifecycles"
          />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.rows.length ? (
          <EmptyState
            icon={Building2}
            title={hasFilters ? "No matches" : `No ${labels.company.plural.toLowerCase()} yet`}
            description={hasFilters ? "Try a different search or filter." : `Add your first ${labels.company.singular.toLowerCase()} to start tracking relationships.`}
            action={
              hasFilters ? null : (
                <Button onClick={() => setCreating(true)}>
                  <Plus />
                  New {labels.company.singular.toLowerCase()}
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
                    <TableHead>Lifecycle</TableHead>
                    <TableHead className="hidden md:table-cell">Industry</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">{labels.contact.plural}</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Open pipeline</TableHead>
                    <TableHead className="hidden xl:table-cell">Owner</TableHead>
                    <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/app/companies/${c.id}`)}>
                      <TableCell>
                        <Link to={`/app/companies/${c.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                          {c.name}
                        </Link>
                        {c.domain ? <div className="font-mono text-xs text-muted-foreground">{c.domain}</div> : null}
                      </TableCell>
                      <TableCell>
                        <ToneBadge options={crmConfig.companyLifecycles} value={c.lifecycle} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{optionLabel(crmConfig.industries, c.industry) || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right font-mono tabular-nums">{c.contactCount}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums">{c.openDealCents ? formatMoney(c.openDealCents) : "—"}</TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground">{c.owner || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{formatRelative(c.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Pager page={list.page} total={data.total} onPageChange={list.setPage} />
          </>
        )}
      </div>
      <CompanyFormDialog open={creating} onOpenChange={setCreating} onSaved={(c) => navigate(`/app/companies/${c.id}`)} />
    </>
  );
}
