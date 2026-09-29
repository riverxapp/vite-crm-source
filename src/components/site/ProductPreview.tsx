import { crmConfig, openStages } from "@/config/crm";

/**
 * The hero visual is the product's own interface (DESIGN.md: "show it, don't
 * illustrate it") — a static, non-interactive pipeline built from the same
 * config the app uses. Figures are sample values for the preview only.
 */
const sample: Record<string, { name: string; company: string; amount: string }[]> = {
  0: [
    { name: "Annual renewal", company: "Northwind", amount: "$24,000" },
    { name: "Pilot rollout", company: "Globex", amount: "$8,500" },
  ],
  1: [{ name: "Team expansion", company: "Initech", amount: "$41,200" }],
  2: [
    { name: "Enterprise plan", company: "Umbrella", amount: "$96,000" },
    { name: "Add-on seats", company: "Hooli", amount: "$12,300" },
  ],
  3: [{ name: "Multi-year deal", company: "Stark & Co", amount: "$180,000" }],
};

export function ProductPreview() {
  const stages = openStages.slice(0, 4);
  return (
    <div className="relative w-full border border-rule-hard bg-card text-left" role="img" aria-label={`Preview of the ${crmConfig.labels.deal.singular.toLowerCase()} pipeline board`}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="rx-meta">{crmConfig.labels.deal.plural} · Pipeline</span>
        <span className="rx-meta flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-warm" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--rule)] md:grid-cols-4">
        {stages.map((stage, i) => (
          <div key={stage.value} className="bg-card">
            <div className="flex items-baseline justify-between border-b px-3 py-2">
              <span className="text-[0.8rem] font-semibold">{stage.label}</span>
              <span className="font-mono text-[0.7rem] text-muted-foreground">{stage.probability}%</span>
            </div>
            <ul className="space-y-2 p-2">
              {(sample[i] ?? []).map((d) => (
                <li key={d.name} className="border bg-card px-2.5 py-2">
                  <p className="truncate text-[0.8rem] font-medium">{d.name}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[0.72rem] text-muted-foreground">{d.company}</span>
                    <span className="font-mono text-[0.72rem]">{d.amount}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
