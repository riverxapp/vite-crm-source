import { Link } from "react-router-dom";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig } from "@/config/crm";
import { formatDate, formatMoney } from "@/lib/format";
import type { DealRow } from "./api";

/** Compact deal list for record detail pages. */
export function DealList({ deals }: { deals: DealRow[] }) {
  return (
    <ul className="divide-y">
      {deals.map((d) => (
        <li key={d.id}>
          <Link to={`/app/deals/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <p className="font-mono text-[0.72rem] text-muted-foreground">
                {d.expectedCloseDate ? `Close ${formatDate(d.expectedCloseDate)}` : "No close date"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-mono tabular-nums">{formatMoney(d.amountCents)}</span>
              <ToneBadge options={crmConfig.dealStages} value={d.stage} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
