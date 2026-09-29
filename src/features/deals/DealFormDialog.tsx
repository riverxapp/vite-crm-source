import { useEffect } from "react";
import { Controller, useForm } from "@/hooks/use-form";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EntityPicker } from "@/components/crm/EntityPicker";
import { FormDialog } from "@/components/crm/FormDialog";
import { FormField } from "@/components/crm/Field";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { crmConfig, openStages } from "@/config/crm";
import type { Option } from "@/db/helpers";
import type { Deal } from "@/db/schema";
import { searchCompanyOptions } from "@/features/companies/api";
import { searchContactOptions } from "@/features/contacts/api";
import { useMutation } from "@/hooks/use-mutation";
import { centsToInput, fromDateInput, toCents, toDateInput } from "@/lib/format";
import { createDeal, updateDeal, type DealRow } from "./api";

type Values = {
  name: string;
  amount: string;
  stage: string;
  expectedCloseDate: string;
  owner: string;
  notes: string;
  company: Option | null;
  contact: Option | null;
};

export type DealDefaults = { company?: Option | null; contact?: Option | null; stage?: string };

function toValues(d?: DealRow | null, defaults?: DealDefaults): Values {
  return {
    name: d?.name ?? "",
    amount: centsToInput(d?.amountCents),
    stage: d?.stage ?? defaults?.stage ?? openStages[0]?.value ?? crmConfig.dealStages[0].value,
    expectedCloseDate: toDateInput(d?.expectedCloseDate),
    owner: d?.owner ?? "",
    notes: d?.notes ?? "",
    company: d?.companyId ? { id: d.companyId, label: d.companyName ?? `#${d.companyId}` } : (defaults?.company ?? null),
    contact: d?.contactId ? { id: d.contactId, label: d.contactName ?? `#${d.contactId}` } : (defaults?.contact ?? null),
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: DealRow | null;
  defaults?: DealDefaults;
  onSaved: (deal: Deal) => void;
};

export function DealFormDialog({ open, onOpenChange, deal, defaults, onSaved }: Props) {
  const label = crmConfig.labels.deal.singular;
  const { register, control, handleSubmit, reset, watch, formState } = useForm<Values>({
    defaultValues: toValues(deal, defaults),
  });
  const company = watch("company");

  useEffect(() => {
    if (open) reset(toValues(deal, defaults));
    // Reset only when the dialog opens, so parent re-renders never wipe typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation(async (v: Values) => {
    const data = {
      name: v.name.trim(),
      amountCents: toCents(v.amount),
      stage: v.stage,
      expectedCloseDate: fromDateInput(v.expectedCloseDate),
      owner: v.owner.trim() || null,
      notes: v.notes.trim() || null,
      companyId: v.company?.id ?? null,
      contactId: v.contact?.id ?? null,
    };
    return deal ? updateDeal(deal.id, data, deal.stage) : createDeal(data);
  });

  const onSubmit = handleSubmit(async (values) => {
    const saved = await save.run(values);
    if (!saved) return;
    toast.success(deal ? `${label} updated` : `${label} created`);
    onOpenChange(false);
    onSaved(saved);
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={deal ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`}
      submitLabel={deal ? "Save changes" : `Create ${label.toLowerCase()}`}
      pending={save.pending}
      onSubmit={onSubmit}
    >
      <FormField label="Name *" htmlFor="deal-name" error={formState.errors.name?.message} className="sm:col-span-2">
        <Input id="deal-name" autoFocus {...register("name", { validate: (v) => v.trim() !== "" || "Name is required" })} />
      </FormField>
      <FormField label={`Amount (${crmConfig.currency})`} htmlFor="deal-amount" error={formState.errors.amount?.message}>
        <Input
          id="deal-amount"
          inputMode="decimal"
          placeholder="0"
          {...register("amount", { validate: (v) => !v || Number.isFinite(Number(v.replace(/,/g, ""))) || "Enter a number" })}
        />
      </FormField>
      <FormField label="Stage" htmlFor="deal-stage">
        <Controller
          control={control}
          name="stage"
          render={({ field }) => <OptionSelect id="deal-stage" options={crmConfig.dealStages} value={field.value} onChange={field.onChange} />}
        />
      </FormField>
      <FormField label={crmConfig.labels.company.singular} htmlFor="deal-company">
        <Controller
          control={control}
          name="company"
          render={({ field }) => <EntityPicker id="deal-company" value={field.value} onChange={field.onChange} search={searchCompanyOptions} />}
        />
      </FormField>
      <FormField label={crmConfig.labels.contact.singular} htmlFor="deal-contact">
        <Controller
          control={control}
          name="contact"
          render={({ field }) => (
            <EntityPicker
              id="deal-contact"
              value={field.value}
              onChange={field.onChange}
              search={(term) => searchContactOptions(term, company?.id)}
            />
          )}
        />
      </FormField>
      <FormField label="Expected close" htmlFor="deal-close">
        <Input id="deal-close" type="date" {...register("expectedCloseDate")} />
      </FormField>
      <FormField label="Owner" htmlFor="deal-owner">
        <Input id="deal-owner" {...register("owner")} />
      </FormField>
      <FormField label="Notes" htmlFor="deal-notes" className="sm:col-span-2">
        <Textarea id="deal-notes" rows={3} {...register("notes")} />
      </FormField>
    </FormDialog>
  );
}
