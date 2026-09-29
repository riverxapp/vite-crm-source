import { useEffect, useState } from "react";
import { CheckSquare, Plus } from "@/components/icons";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/crm/PageHeader";
import { Pager } from "@/components/crm/Pager";
import { SearchInput } from "@/components/crm/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/crm/States";
import { crmConfig } from "@/config/crm";
import { deleteActivity, listTasks, setTaskCompleted, type ActivityRow, type TaskView } from "@/features/activities/api";
import { TaskFormDialog } from "@/features/activities/TaskFormDialog";
import { TaskItem } from "@/features/activities/TaskItem";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListParams } from "@/hooks/use-list-params";

const { labels } = crmConfig;
const views: { value: TaskView; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

export function TasksPage() {
  const list = useListParams(["view"] as const);
  const view = (views.find((v) => v.value === list.filters.view)?.value ?? "open") as TaskView;
  const [searchText, setSearchText] = useState(list.search);
  const debounced = useDebouncedValue(searchText);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityRow | null>(null);

  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, reload } = useAsync(
    () => listTasks({ view, search: list.search, page: list.page }),
    [view, list.search, list.page],
  );

  async function toggle(task: ActivityRow, completed: boolean) {
    try {
      await setTaskCompleted(task.id, completed);
      if (completed) toast.success("Task completed");
      reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function remove(task: ActivityRow) {
    try {
      await deleteActivity(task.id);
      reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={labels.task.plural}
        description="Follow-ups across every record."
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus />
            New {labels.task.singular.toLowerCase()}
          </Button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Tabs value={view} onValueChange={(v) => list.setFilter("view", v === "open" ? "" : v)}>
            <TabsList>
              {views.map((v) => (
                <TabsTrigger key={v.value} value={v.value}>{v.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search tasks…" className="sm:ml-auto" />
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data?.rows.length ? (
          <EmptyState
            icon={CheckSquare}
            title={view === "overdue" ? "Nothing overdue" : view === "completed" ? "No completed tasks" : "You’re all caught up"}
            description={list.search ? "Try a different search." : "Tasks you add from any record show up here."}
          />
        ) : (
          <>
            <Card className="divide-y">
              {data.rows.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={toggle} onEdit={(task) => { setEditing(task); setDialogOpen(true); }} onDelete={remove} />
              ))}
            </Card>
            <Pager page={list.page} total={data.total} onPageChange={list.setPage} />
          </>
        )}
      </div>
      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} onSaved={reload} />
    </>
  );
}
