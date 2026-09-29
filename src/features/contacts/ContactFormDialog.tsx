import { useEffect } from "react";
import { Controller, useForm } from "@/hooks/use-form";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EntityPicker } from "@/components/crm/EntityPicker";
import { FormDialog } from "@/components/crm/FormDialog";
import { FormField } from "@/components/crm/Field";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { crmConfig } from "@/config/crm";
import type { Option } from "@/db/helpers";
import type { Contact } from "@/db/schema";
import { searchCompanyOptions } from "@/features/companies/api";
import { useMutation } from "@/hooks/use-mutation";
import { nullify } from "@/lib/format";
import { createContact, updateContact, type ContactRow } from "./api";

type Values = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  status: string;
  owner: string;
  notes: string;
  company: Option | null;
};

function toValues(c?: ContactRow | null, company?: Option | null): Values {
  return {
    firstName: c?.firstName ?? "",
    lastName: c?.lastName ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    jobTitle: c?.jobTitle ?? "",
    status: c?.status ?? crmConfig.contactStatuses[0].value,
    owner: c?.owner ?? "",
    notes: c?.notes ?? "",
    company: c?.companyId ? { id: c.companyId, label: c.companyName ?? `#${c.companyId}` } : (company ?? null),
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactRow | null;
  /** Pre-selects the company when creating from a company page. */
  defaultCompany?: Option | null;
  onSaved: (contact: Contact) => void;
};

export function ContactFormDialog({ open, onOpenChange, contact, defaultCompany, onSaved }: Props) {
  const label = crmConfig.labels.contact.singular;
  const { register, control, handleSubmit, reset, formState } = useForm<Values>({
    defaultValues: toValues(contact, defaultCompany),
  });

  useEffect(() => {
    if (open) reset(toValues(contact, defaultCompany));
    // Reset only when the dialog opens, so parent re-renders never wipe typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation(async ({ company, ...values }: Values) => {
    const data = {
      ...nullify(values),
      firstName: values.firstName.trim(),
      status: values.status,
      companyId: company?.id ?? null,
    };
    return contact ? updateContact(contact.id, data) : createContact(data);
  });

  const onSubmit = handleSubmit(async (values) => {
    const saved = await save.run(values);
    if (!saved) return;
    toast.success(contact ? `${label} updated` : `${label} created`);
    onOpenChange(false);
    onSaved(saved);
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`}
      submitLabel={contact ? "Save changes" : `Create ${label.toLowerCase()}`}
      pending={save.pending}
      onSubmit={onSubmit}
    >
      <FormField label="First name *" htmlFor="contact-first" error={formState.errors.firstName?.message}>
        <Input id="contact-first" autoFocus {...register("firstName", { validate: (v) => v.trim() !== "" || "First name is required" })} />
      </FormField>
      <FormField label="Last name" htmlFor="contact-last">
        <Input id="contact-last" {...register("lastName")} />
      </FormField>
      <FormField label="Email" htmlFor="contact-email" error={formState.errors.email?.message}>
        <Input
          id="contact-email"
          type="email"
          {...register("email", { validate: (v) => !v || /^\S+@\S+\.\S+$/.test(v) || "Enter a valid email" })}
        />
      </FormField>
      <FormField label="Phone" htmlFor="contact-phone">
        <Input id="contact-phone" type="tel" {...register("phone")} />
      </FormField>
      <FormField label="Job title" htmlFor="contact-title">
        <Input id="contact-title" {...register("jobTitle")} />
      </FormField>
      <FormField label="Status" htmlFor="contact-status">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <OptionSelect id="contact-status" options={crmConfig.contactStatuses} value={field.value} onChange={field.onChange} />
          )}
        />
      </FormField>
      <FormField label={crmConfig.labels.company.singular} htmlFor="contact-company" className="sm:col-span-2">
        <Controller
          control={control}
          name="company"
          render={({ field }) => (
            <EntityPicker
              id="contact-company"
              value={field.value}
              onChange={field.onChange}
              search={searchCompanyOptions}
              placeholder={`Select ${crmConfig.labels.company.singular.toLowerCase()}…`}
            />
          )}
        />
      </FormField>
      <FormField label="Owner" htmlFor="contact-owner">
        <Input id="contact-owner" {...register("owner")} />
      </FormField>
      <FormField label="Notes" htmlFor="contact-notes" className="sm:col-span-2">
        <Textarea id="contact-notes" rows={3} {...register("notes")} />
      </FormField>
    </FormDialog>
  );
}
