import { useState } from "react";
import { ListTodo, Plus, Trash2 } from "@/components/icons";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDelete } from "@/components/crm/ConfirmDelete";
import { EmptyState, ErrorState, LoadingRows } from "@/components/crm/States";
import { crmConfig } from "@/config/crm";
import { useAsync } from "@/hooks/use-async";
import { useMutation } from "@/hooks/use-mutation";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { activityIcons } from "./activity-meta";
import { createActivity, deleteActivity, listTimeline, setTaskCompleted, type ActivityRow, type ActivityScope } from "./api";
import { TaskFormDialog, type TaskLinks } from "./TaskFormDialog";
import { TaskItem } from "./TaskItem";

const loggableTypes = crmConfig.activityTypes.filter((t) => t.value !== "task");

type ActivityPanelProps = {
  /** Records the new activity is linked to (a contact's company, a deal's company and contact, …). */
  scope: ActivityScope;
  /** Which of the scope's ids the timeline is filtered by. */
  timelineScope: ActivityScope;
  taskLinks: TaskLinks;
};

export function ActivityPanel({ scope, timelineScope, taskLinks }: ActivityPanelProps) {
  const [type, setType] = useState(loggableTypes[0]?.value ?? "note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const timeline = useAsync(() => listTimeline(timelineScope), [JSON.stringify(timelineScope)]);

  const log = useMutation(async () => {
    const typeLabel = loggableTypes.find((t) => t.value === type)?.label ?? type;
    await createActivity({ ...scope, type, subject: subject.trim() || typeLabel, body: body.trim() || null });
  });

  async function submit() {
    if (!subject.trim() && !body.trim()) return;
    await log.run();
    setSubject("");
    setBody("");
    timeline.reload();
  }

  async function toggle(task: ActivityRow, completed: boolean) {
    await setTaskCompleted(task.id, completed).catch((e) => toast.error(String(e)));
    timeline.reload();
  }

  async function remove(activity: ActivityRow) {
    await deleteActivity(activity.id).catch((e) => toast.error(String(e)));
    timeline.reload();
  }

  const items = timeline.data ?? [];
  const openTasks = items.filter((a) => a.type === "task" && !a.completedAt);
  const history = items.filter((a) => !(a.type === "task" && !a.completedAt));

  return (
    <div className="space-y-4">
      <Card className="border-rule-strong focus-within:border-brand">
        <CardContent className="space-y-3">
          <Tabs value={type} onValueChange={setType} className="-mx-4 -mt-4">
            <TabsList aria-label="Activity type" className="px-1">
              {loggableTypes.map((t) => {
                const Icon = activityIcons[t.value] ?? activityIcons.note;
                return (
                  <TabsTrigger key={t.value} value={t.value}>
                    <Icon />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" aria-label="Subject" />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What happened?"
            rows={3}
            aria-label="Details"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="rx-meta hidden sm:inline">⌘/Ctrl + Enter to save</span>
            <Button size="sm" onClick={() => void submit()} disabled={log.pending || (!subject.trim() && !body.trim())}>
              {log.pending ? "Saving…" : "Log activity"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Open {crmConfig.labels.task.plural.toLowerCase()}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setTaskOpen(true); }}>
            <Plus />
            Add
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {openTasks.length ? (
            <div className="divide-y">
              {openTasks.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={toggle} onEdit={(task) => { setEditing(task); setTaskOpen(true); }} onDelete={remove} showLinks={false} />
              ))}
            </div>
          ) : (
            <p className="px-4 py-4 text-sm text-muted-foreground">Nothing open.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="rx-meta mb-3">Timeline</h3>
        {timeline.error ? (
          <ErrorState error={timeline.error} onRetry={timeline.reload} />
        ) : timeline.loading && !timeline.data ? (
          <LoadingRows rows={3} />
        ) : history.length ? (
          <ol className="relative space-y-4 border-l pl-6">
            {history.map((a) => {
              const Icon = activityIcons[a.type] ?? activityIcons.note;
              return (
                <li key={a.id} className="group relative">
                  <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center border bg-card">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", a.type === "task" && "line-through text-muted-foreground")}>{a.subject}</p>
                      <p className="font-mono text-[0.7rem] uppercase tracking-[0.04em] text-muted-foreground" title={formatDateTime(a.createdAt)}>
                        {crmConfig.activityTypes.find((t) => t.value === a.type)?.label ?? a.type} · {formatRelative(a.createdAt)}
                      </p>
                    </div>
                    <ConfirmDelete title="Delete activity?" description="This can’t be undone." onConfirm={() => remove(a)}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" aria-label="Delete activity">
                        <Trash2 />
                      </Button>
                    </ConfirmDelete>
                  </div>
                  {a.body ? <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p> : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState icon={ListTodo} title="No activity yet" description="Log a call, email, meeting or note above." />
        )}
      </div>

      <TaskFormDialog open={taskOpen} onOpenChange={setTaskOpen} task={editing} links={taskLinks} onSaved={timeline.reload} />
    </div>
  );
}
