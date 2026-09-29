import { Building2, CheckSquare, Handshake, LayoutDashboard, Settings, Users, type IconComponent } from "@/components/icons";
import { crmConfig } from "@/config/crm";

export type NavItem = { to: string; label: string; icon: IconComponent; end?: boolean };

const { labels } = crmConfig;

export const navItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/companies", label: labels.company.plural, icon: Building2 },
  { to: "/app/contacts", label: labels.contact.plural, icon: Users },
  { to: "/app/deals", label: labels.deal.plural, icon: Handshake },
  { to: "/app/tasks", label: labels.task.plural, icon: CheckSquare },
];

export const secondaryNavItems: NavItem[] = [{ to: "/app/settings", label: "Settings", icon: Settings }];
