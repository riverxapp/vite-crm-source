import { Link } from "react-router-dom";
import { crmConfig } from "@/config/crm";
import { initials } from "@/lib/format";

export function BrandMark({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary font-mono text-[0.72rem] font-semibold text-primary-foreground">
        {initials(crmConfig.appName) || "C"}
      </span>
      <span className="truncate text-[0.95rem] font-bold tracking-tight">{crmConfig.appName}</span>
    </Link>
  );
}
