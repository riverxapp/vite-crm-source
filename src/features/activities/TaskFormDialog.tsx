import { useEffect } from "react";
import { Controller, useForm } from "@/hooks/use-form";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EntityPicker } from "@/components/crm/EntityPicker";
import { FormDialog } from "@/components/crm/FormDialog";
import { FormField } from "@/components/crm/Field";
import { crmConfig } from "@/config/crm";
import type { Option } from "@/db/helpers";
import { searchCompanyOptions } from "@/features/companies/api";
import { searchContactOptions } from "@/features/contacts/api";
import { searchDealOptions } from "@/features/deals/api";
import { useMutation } from "@/hooks/use-mutation";
import { fromDateInput, toDateInput } from "@/lib/format";
import { createActivity, updateActivity, type ActivityRow } from "./api";

type Values = {
  subject: string;
  body: string;
  dueAt: string;
  owner: string;
  company: Option | null;
  contact: Option | null;
  deal: Option | null;
};

export type TaskLinks = { company?: Option | null; contact?: Option | null; deal?: Option | null };

function toValues(t?: ActivityRow | null, links?: TaskLinks): Values {
  const link = (id: number | null | undefined, name: string | null | undefined, fallback?: Option | null) =>
    id ? { id, label: name ?? `#${id}` } : (fallback ?? null);
  return {
    subject: t?.subject ?? "",
    body: t?.body ?? "",
    dueAt: toDateInput(t?.dueAt),
    owner: t?.owner ?? "",
    company: link(t?.companyId, t?.companyName, links?.company),
    contact: link(t?.contactId, t?.contactName, links?.contact),
    deal: link(t?.dealId, t?.dealName, links?.deal),
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ActivityRow | null;
  links?: TaskLinks;
  onSaved: () => void;
};

export function TaskFormDialog({ open, onOpenChange, task, links, onSaved }: Props) {
  const label = crmConfig.labels.task.singular;
  const { register, control, handleSubmit, reset, formState } = useForm<Values>({ defaultValues: toValues(task, links) });

  useEffect(() => {
    if (open) reset(toValues(task, links));
    // Reset only when the dialog opens, so parent re-renders never wipe typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation(async (v: Values) => {
    const data = {
      type: "task",
      subject: v.subject.trim(),
      body: v.body.trim() || null,
      dueAt: fromDateInput(v.dueAt),
      owner: v.owner.trim() || null,
      companyId: v.company?.id ?? null,
      contactId: v.contact?.id ?? null,
      dealId: v.deal?.id ?? null,
    };
    return task ? updateActivity(task.id, data) : createActivity(data);
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!(await save.run(values))) return;
    toast.success(task ? `${label} updated` : `${label} created`);
    onOpenChange(false);
    onSaved();
  });

  const picker = (name: "company" | "contact" | "deal", search: (t: string) => Promise<Option[]>) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <EntityPicker id={`task-${name}`} value={field.value} onChange={field.onChange} search={search} />}
    />
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`}
      submitLabel={task ? "Save changes" : `Create ${label.toLowerCase()}`}
      pending={save.pending}
      onSubmit={onSubmit}
    >
      <FormField label="Title *" htmlFor="task-subject" error={formState.errors.subject?.message} className="sm:col-span-2">
        <Input id="task-subject" autoFocus {...register("subject", { validate: (v) => v.trim() !== "" || "Title is required" })} />
      </FormField>
      <FormField label="Due date" htmlFor="task-due">
        <Input id="task-due" type="date" {...register("dueAt")} />
      </FormField>
      <FormField label="Assignee" htmlFor="task-owner">
        <Input id="task-owner" {...register("owner")} />
      </FormField>
      <FormField label={crmConfig.labels.company.singular} htmlFor="task-company">
        {picker("company", searchCompanyOptions)}
      </FormField>
      <FormField label={crmConfig.labels.contact.singular} htmlFor="task-contact">
        {picker("contact", (t) => searchContactOptions(t))}
      </FormField>
      <FormField label={crmConfig.labels.deal.singular} htmlFor="task-deal" className="sm:col-span-2">
        {picker("deal", searchDealOptions)}
      </FormField>
      <FormField label="Details" htmlFor="task-body" className="sm:col-span-2">
        <Textarea id="task-body" rows={3} {...register("body")} />
      </FormField>
    </FormDialog>
  );
}
