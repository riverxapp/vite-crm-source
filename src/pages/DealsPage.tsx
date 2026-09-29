import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Handshake, Kanban, List, Plus } from "@/components/icons";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { PageHeader } from "@/components/crm/PageHeader";
import { Pager } from "@/components/crm/Pager";
import { SearchInput } from "@/components/crm/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/crm/States";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig, openStages } from "@/config/crm";
import { listDeals, listDealsForBoard, moveDealToStage, type DealRow } from "@/features/deals/api";
import { DealBoard } from "@/features/deals/DealBoard";
import { DealFormDialog, type DealDefaults } from "@/features/deals/DealFormDialog";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate, formatMoney, formatMoneyCompact, plural } from "@/lib/format";

const { labels } = crmConfig;

export function DealsPage() {
  const navigate = useNavigate();
  const list = useListParams(["view", "stage"] as const);
  const view = list.filters.view === "list" ? "list" : "board";
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);
  const [creating, setCreating] = useState<DealDefaults | null>(null);
  const [board, setBoard] = useState<DealRow[] | null>(null);

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const boardQuery = useAsync(() => listDealsForBoard(list.search), [list.search], view === "board");
  const listQuery = useAsync(
    () => listDeals({ search: list.search, stage: list.filters.stage, page: list.page }),
    [list.search, list.filters.stage, list.page],
    view === "list",
  );

  // Local copy of board rows so stage moves render instantly.
  useEffect(() => {
    if (boardQuery.data) setBoard(boardQuery.data);
  }, [boardQuery.data]);

  async function move(deal: DealRow, stage: string) {
    const previous = board;
    setBoard((rows) => rows?.map((d) => (d.id === deal.id ? { ...d, stage } : d)) ?? rows);
    try {
      await moveDealToStage(deal.id, stage);
      toast.success(`Moved to ${crmConfig.dealStages.find((s) => s.value === stage)?.label ?? stage}`);
    } catch (e) {
      setBoard(previous);
      toast.error("Couldn’t move deal", { description: String(e) });
    }
  }

  const openTotal = (board ?? []).filter((d) => openStages.some((s) => s.value === d.stage)).reduce((n, d) => n + d.amountCents, 0);
  const active = view === "board" ? boardQuery : listQuery;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={labels.deal.plural}
        description={
          <span className="font-mono text-xs">
            {view === "board" && board
              ? `${formatMoneyCompact(openTotal)} open pipeline`
              : listQuery.data
                ? `${plural(listQuery.data.total, "record")}`
                : "\u00a0"}
          </span>
        }
        actions={
          <Button onClick={() => setCreating({})}>
            <Plus />
            New {labels.deal.singular.toLowerCase()}
          </Button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={searchText} onChange={setSearchText} placeholder={`Search ${labels.deal.plural.toLowerCase()}…`} />
          {view === "list" ? (
            <OptionSelect kind="filter" options={crmConfig.dealStages} value={list.filters.stage} onChange={(v) => list.setFilter("stage", v)} emptyLabel="All stages" />
          ) : null}
          <Tabs value={view} onValueChange={(v) => list.setFilter("view", v === "board" ? "" : v)} className="sm:ml-auto">
            <TabsList aria-label="View">
              <TabsTrigger value="board"><Kanban /> Board</TabsTrigger>
              <TabsTrigger value="list"><List /> List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {active.error ? (
          <ErrorState error={active.error} onRetry={active.reload} />
        ) : view === "board" ? (
          !board ? (
            <LoadingRows />
          ) : !board.length && !list.search ? (
            <EmptyState
              icon={Handshake}
              title={`No ${labels.deal.plural.toLowerCase()} yet`}
              description="Create one and drag it across stages as it progresses."
              action={<Button onClick={() => setCreating({})}><Plus />New {labels.deal.singular.toLowerCase()}</Button>}
            />
          ) : (
            <DealBoard deals={board} onMove={move} onCreate={(stage) => setCreating({ stage })} />
          )
        ) : listQuery.loading && !listQuery.data ? (
          <LoadingRows />
        ) : !listQuery.data?.rows.length ? (
          <EmptyState icon={Handshake} title="No matches" description="Try a different search or stage." />
        ) : (
          <>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">{labels.company.singular}</TableHead>
                    <TableHead className="hidden lg:table-cell">Expected close</TableHead>
                    <TableHead className="hidden xl:table-cell">Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.data.rows.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/app/deals/${d.id}`)}>
                      <TableCell>
                        <Link to={`/app/deals/${d.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                          {d.name}
                        </Link>
                      </TableCell>
                      <TableCell><ToneBadge options={crmConfig.dealStages} value={d.stage} /></TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatMoney(d.amountCents)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{d.companyName || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{formatDate(d.expectedCloseDate)}</TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground">{d.owner || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Pager page={list.page} total={listQuery.data.total} onPageChange={list.setPage} />
          </>
        )}
      </div>
      <DealFormDialog
        open={creating !== null}
        onOpenChange={(o) => !o && setCreating(null)}
        defaults={creating ?? undefined}
        onSaved={() => active.reload()}
      />
    </>
  );
}
