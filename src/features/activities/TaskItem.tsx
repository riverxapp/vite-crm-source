import { Link } from "react-router-dom";
import { CalendarDays, Pencil, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDelete } from "@/components/crm/ConfirmDelete";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityRow } from "./api";

type TaskItemProps = {
  task: ActivityRow;
  onToggle: (task: ActivityRow, completed: boolean) => void;
  onEdit?: (task: ActivityRow) => void;
  onDelete?: (task: ActivityRow) => void;
  showLinks?: boolean;
};

export function TaskItem({ task, onToggle, onEdit, onDelete, showLinks = true }: TaskItemProps) {
  const done = Boolean(task.completedAt);
  const overdue = !done && isOverdue(task.dueAt);
  const links = [
    task.companyId && task.companyName ? { to: `/app/companies/${task.companyId}`, label: task.companyName } : null,
    task.contactId && task.contactName ? { to: `/app/contacts/${task.contactId}`, label: task.contactName } : null,
    task.dealId && task.dealName ? { to: `/app/deals/${task.dealId}`, label: task.dealName } : null,
  ].filter((l): l is { to: string; label: string } => Boolean(l));

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition-colors [transition-duration:120ms] hover:bg-accent">
      <Checkbox
        className="mt-0.5"
        checked={done}
        onCheckedChange={(v) => onToggle(task, v === true)}
        aria-label={done ? `Mark "${task.subject}" as open` : `Mark "${task.subject}" as done`}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{task.subject}</p>
        {task.body ? <p className="line-clamp-2 text-sm text-muted-foreground">{task.body}</p> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.dueAt ? (
            <span className={cn("inline-flex items-center gap-1 font-mono text-[0.72rem]", overdue && "font-medium text-destructive")}>
              <CalendarDays className="h-3.5 w-3.5" />
              {overdue ? "Overdue · " : ""}
              {formatDate(task.dueAt)}
            </span>
          ) : null}
          {task.owner ? <span>{task.owner}</span> : null}
          {showLinks
            ? links.map((l) => (
                <Link key={l.to} to={l.to} className="hover:text-foreground hover:underline">
                  {l.label}
                </Link>
              ))
            : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        {onEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)} aria-label="Edit task">
            <Pencil />
          </Button>
        ) : null}
        {onDelete ? (
          <ConfirmDelete title="Delete task?" description="This can’t be undone." onConfirm={() => onDelete(task)}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete task">
              <Trash2 />
            </Button>
          </ConfirmDelete>
        ) : null}
      </div>
    </div>
  );
}
