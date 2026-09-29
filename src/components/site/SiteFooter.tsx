import { Link } from "react-router-dom";
import { crmConfig } from "@/config/crm";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="rx-meta">
          © {new Date().getFullYear()} {crmConfig.appName}
        </p>
        <nav className="flex gap-5" aria-label="Footer">
          <Link to="/login" className="rx-meta hover:text-foreground">Log in</Link>
          <Link to="/signup" className="rx-meta hover:text-foreground">Sign up</Link>
        </nav>
      </div>
    </footer>
  );
}
