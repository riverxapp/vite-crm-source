import { Link, useLocation } from "react-router-dom";
import { Compass } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/States";

export function NotFoundPage() {
  const inApp = useLocation().pathname.startsWith("/app");
  return (
    <div className="p-6">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you’re looking for doesn’t exist."
        action={<Button asChild variant="outline"><Link to={inApp ? "/app" : "/"}>{inApp ? "Go to dashboard" : "Go home"}</Link></Button>}
      />
    </div>
  );
}
