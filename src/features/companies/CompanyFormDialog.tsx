import { useEffect } from "react";
import { Controller, useForm } from "@/hooks/use-form";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/crm/FormDialog";
import { FormField } from "@/components/crm/Field";
import { OptionSelect } from "@/components/crm/OptionSelect";
import { crmConfig } from "@/config/crm";
import type { Company } from "@/db/schema";
import { useMutation } from "@/hooks/use-mutation";
import { nullify } from "@/lib/format";
import { createCompany, updateCompany } from "./api";

type Values = {
  name: string;
  domain: string;
  industry: string;
  size: string;
  lifecycle: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  owner: string;
  description: string;
};

function toValues(c?: Company | null): Values {
  return {
    name: c?.name ?? "",
    domain: c?.domain ?? "",
    industry: c?.industry ?? "",
    size: c?.size ?? "",
    lifecycle: c?.lifecycle ?? crmConfig.companyLifecycles[0].value,
    phone: c?.phone ?? "",
    website: c?.website ?? "",
    address: c?.address ?? "",
    city: c?.city ?? "",
    country: c?.country ?? "",
    owner: c?.owner ?? "",
    description: c?.description ?? "",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSaved: (company: Company) => void;
};

export function CompanyFormDialog({ open, onOpenChange, company, onSaved }: Props) {
  const label = crmConfig.labels.company.singular;
  const form = useForm<Values>({ defaultValues: toValues(company) });
  const { register, control, handleSubmit, reset, formState } = form;

  useEffect(() => {
    if (open) reset(toValues(company));
    // Reset only when the dialog opens, so parent re-renders never wipe typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation(async (values: Values) => {
    const data = { ...nullify(values), name: values.name.trim(), lifecycle: values.lifecycle };
    return company ? updateCompany(company.id, data) : createCompany(data);
  });

  const onSubmit = handleSubmit(async (values) => {
    const saved = await save.run(values);
    if (!saved) return;
    toast.success(company ? `${label} updated` : `${label} created`);
    onOpenChange(false);
    onSaved(saved);
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={company ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`}
      submitLabel={company ? "Save changes" : `Create ${label.toLowerCase()}`}
      pending={save.pending}
      onSubmit={onSubmit}
    >
      <FormField label="Name *" htmlFor="company-name" error={formState.errors.name?.message} className="sm:col-span-2">
        <Input id="company-name" autoFocus {...register("name", { validate: (v) => v.trim() !== "" || "Name is required" })} />
      </FormField>
      <FormField label="Domain" htmlFor="company-domain">
        <Input id="company-domain" placeholder="example.com" {...register("domain")} />
      </FormField>
      <FormField label="Lifecycle" htmlFor="company-lifecycle">
        <Controller
          control={control}
          name="lifecycle"
          render={({ field }) => (
            <OptionSelect id="company-lifecycle" options={crmConfig.companyLifecycles} value={field.value} onChange={field.onChange} />
          )}
        />
      </FormField>
      <FormField label="Industry" htmlFor="company-industry">
        <Controller
          control={control}
          name="industry"
          render={({ field }) => (
            <OptionSelect id="company-industry" options={crmConfig.industries} value={field.value} onChange={field.onChange} emptyLabel="None" />
          )}
        />
      </FormField>
      <FormField label="Size" htmlFor="company-size">
        <Controller
          control={control}
          name="size"
          render={({ field }) => (
            <OptionSelect id="company-size" options={crmConfig.companySizes} value={field.value} onChange={field.onChange} emptyLabel="None" />
          )}
        />
      </FormField>
      <FormField label="Phone" htmlFor="company-phone">
        <Input id="company-phone" type="tel" {...register("phone")} />
      </FormField>
      <FormField label="Website" htmlFor="company-website">
        <Input id="company-website" type="url" placeholder="https://" {...register("website")} />
      </FormField>
      <FormField label="Address" htmlFor="company-address" className="sm:col-span-2">
        <Input id="company-address" {...register("address")} />
      </FormField>
      <FormField label="City" htmlFor="company-city">
        <Input id="company-city" {...register("city")} />
      </FormField>
      <FormField label="Country" htmlFor="company-country">
        <Input id="company-country" {...register("country")} />
      </FormField>
      <FormField label="Owner" htmlFor="company-owner">
        <Input id="company-owner" placeholder="Account owner" {...register("owner")} />
      </FormField>
      <FormField label="Description" htmlFor="company-description" className="sm:col-span-2">
        <Textarea id="company-description" rows={3} {...register("description")} />
      </FormField>
    </FormDialog>
  );
}
