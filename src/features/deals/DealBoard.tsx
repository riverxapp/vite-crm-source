import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { crmConfig } from "@/config/crm";
import { formatDate, formatMoney, formatMoneyCompact, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DealRow } from "./api";

type DealBoardProps = {
  deals: DealRow[];
  onMove: (deal: DealRow, stage: string) => void;
  onCreate: (stage: string) => void;
};

export function DealBoard({ deals, onMove, onCreate }: DealBoardProps) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  function drop(e: DragEvent, stage: string) {
    e.preventDefault();
    setOverStage(null);
    const id = Number(e.dataTransfer.getData("text/plain"));
    const deal = deals.find((d) => d.id === id);
    if (deal && deal.stage !== stage) onMove(deal, stage);
    setDragId(null);
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max gap-px border bg-[var(--rule)]">
        {crmConfig.dealStages.map((stage) => {
          const items = deals.filter((d) => d.stage === stage.value);
          const total = items.reduce((n, d) => n + d.amountCents, 0);
          return (
            <section
              key={stage.value}
              aria-label={stage.label}
              className={cn(
                "flex w-72 shrink-0 flex-col bg-card transition-colors [transition-duration:120ms]",
                overStage === stage.value && "bg-accent",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage.value);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.value ? null : s))}
              onDrop={(e) => drop(e, stage.value)}
            >
              <header className="flex items-center justify-between gap-2 border-b bg-muted px-3 py-2">
                <div className="min-w-0">
                  <h2 className="truncate font-mono text-[0.72rem] font-semibold uppercase tracking-[0.08em]">
                    {stage.label} <span className="font-normal text-muted-foreground">{items.length}</span>
                  </h2>
                  <p className="font-mono text-[0.72rem] tabular-nums text-muted-foreground">
                    {formatMoneyCompact(total)}
                    {stage.kind === "open" ? ` · ${stage.probability}%` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCreate(stage.value)} aria-label={`Add to ${stage.label}`}>
                  <Plus />
                </Button>
              </header>
              <ol className="flex min-h-32 flex-1 flex-col gap-2 p-2">
                {items.map((d) => (
                  <li
                    key={d.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(d.id));
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(d.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "group cursor-grab border bg-card p-3 transition-colors [transition-duration:120ms] active:cursor-grabbing hover:border-rule-strong",
                      dragId === d.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/app/deals/${d.id}`} className="min-w-0 text-sm font-medium hover:underline">
                        {d.name}
                      </Link>
                      <StageMenu deal={d} onMove={onMove} />
                    </div>
                    {d.companyName ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.companyName}</p> : null}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-medium font-mono tabular-nums">{formatMoney(d.amountCents)}</span>
                      {d.expectedCloseDate ? (
                        <span className={cn("font-mono text-muted-foreground", stage.kind === "open" && isOverdue(d.expectedCloseDate) && "text-destructive")}>
                          {formatDate(d.expectedCloseDate)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Keyboard- and touch-friendly alternative to drag and drop. */
function StageMenu({ deal, onMove }: { deal: DealRow; onMove: DealBoardProps["onMove"] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-6 w-6 shrink-0 text-muted-foreground" aria-label={`Move ${deal.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {crmConfig.dealStages
          .filter((s) => s.value !== deal.stage)
          .map((s) => (
            <DropdownMenuItem key={s.value} onSelect={() => onMove(deal, s.value)}>
              {s.label}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
