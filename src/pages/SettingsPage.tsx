import { useState } from "react";
import { CheckCircle2, Database, XCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/crm/PageHeader";
import { ToneBadge } from "@/components/crm/ToneBadge";
import { crmConfig, type Option } from "@/config/crm";
import { checkDatabaseHealth, isDatabaseConfigured } from "@/db/client";
import { env } from "@/lib/env";

function OptionList({ title, options, note }: { title: string; options: readonly Option[]; note?: (o: Option) => string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <span key={o.value} className="inline-flex items-center gap-1">
            <ToneBadge options={options} value={o.value} />
            {note ? <span className="text-xs text-muted-foreground">{note(o)}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    try {
      const result = await checkDatabaseHealth();
      setStatus({ ok: true, message: `Connected${result.mode ? ` (${String(result.mode)})` : ""}` });
    } catch (e) {
      setStatus({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Settings" description="Workspace configuration and database status." />
      <div className="grid max-w-4xl gap-6 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4" /> Database</CardTitle>
            <CardDescription>Turso (libSQL) via the Data API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">Endpoint</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{env.dbUrl || "not configured"}</code>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={check} disabled={!isDatabaseConfigured || checking}>
                {checking ? "Checking…" : "Test connection"}
              </Button>
              {status ? (
                <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${status.ok ? "text-success" : "text-destructive"}`}>
                  {status.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {status.message}
                </span>
              ) : null}
            </div>
            <p className="border border-amber-600/35 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              The published app reads and writes this database through its own sign-in-gated server API. Any signed-in user
              can read and write every record, and sign-up is open: restrict both before storing real customer data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CRM configuration</CardTitle>
            <CardDescription>
              Edit <code className="rounded bg-muted px-1">src/config/crm.ts</code> to rename entities, change pipeline stages,
              statuses, industries and currency ({crmConfig.currency}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <OptionList title="Deal stages" options={crmConfig.dealStages} note={(o) => `${crmConfig.dealStages.find((s) => s.value === o.value)?.probability}%`} />
            <OptionList title="Company lifecycles" options={crmConfig.companyLifecycles} />
            <OptionList title="Contact statuses" options={crmConfig.contactStatuses} />
            <OptionList title="Industries" options={crmConfig.industries} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
