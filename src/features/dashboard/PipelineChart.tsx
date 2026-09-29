import { useState } from "react";
import { formatMoney, formatMoneyCompact, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardData } from "./api";

/** Rounds up to 1 / 2 / 2.5 / 5 × 10ⁿ so the axis ticks are readable. */
function niceStep(raw: number) {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const r = raw / magnitude;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * magnitude;
}

const TICKS = 4;

/**
 * Single-series magnitude by stage (replaces recharts): one hue, no legend,
 * thin bars with a 4px rounded top on the baseline, recessive grid, and a
 * per-column hover/focus tooltip. A visually hidden table carries the data.
 */
export function PipelineChart({ pipeline }: { pipeline: DashboardData["pipeline"] }) {
  const [active, setActive] = useState<number | null>(null);
  const step = niceStep(Math.max(...pipeline.map((s) => s.amountCents), 100) / TICKS);
  const max = step * TICKS;
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => i * step);

  return (
    <figure className="w-full">
      <div className="flex h-60 gap-2">
        {/* y-axis labels */}
        <div className="relative w-14 shrink-0" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 translate-y-1/2 font-mono text-[0.7rem] text-muted-foreground"
              style={{ bottom: `${(t / max) * 100}%` }}
            >
              {formatMoneyCompact(t)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden="true" />
          ))}
          <div className="absolute inset-0 flex">
            {pipeline.map((s, i) => {
              const pct = (s.amountCents / max) * 100;
              const isActive = active === i;
              return (
                <div
                  key={s.stage}
                  tabIndex={0}
                  role="img"
                  aria-label={`${s.label}: ${formatMoney(s.amountCents)}, ${plural(s.count, "deal")}`}
                  className={cn(
                    "relative flex h-full flex-1 items-end justify-center outline-none transition-colors [transition-duration:120ms] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isActive && "bg-muted",
                  )}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                >
                  <span className="w-3/5 max-w-14 rounded-t-[4px] bg-chart-1" style={{ height: `${pct}%` }} />
                  {isActive ? (
                    <div
                      className="pointer-events-none absolute left-1/2 z-10 min-w-40 -translate-x-1/2 border border-rule-strong bg-popover px-3 py-2 text-xs shadow-modal"
                      style={{ bottom: `calc(${Math.min(pct, 78)}% + 8px)` }}
                    >
                      <p className="font-medium">{s.label}</p>
                      <div className="mt-1 flex justify-between gap-4">
                        <span className="text-muted-foreground">{plural(s.count, "deal")}</span>
                        <span className="font-mono font-medium tabular-nums">{formatMoney(s.amountCents)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* x-axis labels, aligned with the columns above */}
      <div className="mt-2 flex gap-2" aria-hidden="true">
        <div className="w-14 shrink-0" />
        <div className="flex flex-1">
          {pipeline.map((s) => (
            <span key={s.stage} className="flex-1 truncate px-1 text-center text-xs text-muted-foreground">
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>Open pipeline by stage</caption>
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Deals</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map((s) => (
            <tr key={s.stage}>
              <th scope="row">{s.label}</th>
              <td>{s.count}</td>
              <td>{formatMoney(s.amountCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
