import { env } from "@/lib/env";

/**
 * Single place to adapt this CRM template to a business.
 * Rename entities, change pipeline stages, industries, statuses and currency here.
 * Stored values are the `value` keys: renaming a label is safe, changing a `value`
 * orphans existing rows that use the old key.
 */

export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

export type Option = { value: string; label: string; tone?: Tone };

export type DealStage = Option & {
  /** Default win probability (0-100), used for the weighted pipeline. */
  probability: number;
  kind: "open" | "won" | "lost";
};

export const crmConfig = {
  appName: env.appName,
  currency: "USD",
  locale: "en-US",
  pageSize: 25,

  labels: {
    company: { singular: "Company", plural: "Companies" },
    contact: { singular: "Contact", plural: "Contacts" },
    deal: { singular: "Deal", plural: "Deals" },
    task: { singular: "Task", plural: "Tasks" },
  },

  companyLifecycles: [
    { value: "lead", label: "Lead", tone: "neutral" },
    { value: "prospect", label: "Prospect", tone: "blue" },
    { value: "customer", label: "Customer", tone: "green" },
    { value: "partner", label: "Partner", tone: "violet" },
    { value: "churned", label: "Churned", tone: "red" },
  ] satisfies Option[],

  companySizes: [
    { value: "1-10", label: "1–10" },
    { value: "11-50", label: "11–50" },
    { value: "51-200", label: "51–200" },
    { value: "201-1000", label: "201–1,000" },
    { value: "1000+", label: "1,000+" },
  ] satisfies Option[],

  industries: [
    { value: "technology", label: "Technology" },
    { value: "finance", label: "Finance" },
    { value: "healthcare", label: "Healthcare" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "retail", label: "Retail" },
    { value: "education", label: "Education" },
    { value: "professional-services", label: "Professional services" },
    { value: "real-estate", label: "Real estate" },
    { value: "other", label: "Other" },
  ] satisfies Option[],

  contactStatuses: [
    { value: "active", label: "Active", tone: "green" },
    { value: "inactive", label: "Inactive", tone: "neutral" },
    { value: "do-not-contact", label: "Do not contact", tone: "red" },
  ] satisfies Option[],

  dealStages: [
    { value: "qualification", label: "Qualification", probability: 10, kind: "open", tone: "neutral" },
    { value: "discovery", label: "Discovery", probability: 25, kind: "open", tone: "blue" },
    { value: "proposal", label: "Proposal", probability: 50, kind: "open", tone: "blue" },
    { value: "negotiation", label: "Negotiation", probability: 75, kind: "open", tone: "amber" },
    { value: "won", label: "Won", probability: 100, kind: "won", tone: "green" },
    { value: "lost", label: "Lost", probability: 0, kind: "lost", tone: "red" },
  ] satisfies DealStage[],

  activityTypes: [
    { value: "note", label: "Note" },
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "meeting", label: "Meeting" },
    { value: "task", label: "Task" },
  ] satisfies Option[],
};

export const openStages = crmConfig.dealStages.filter((s) => s.kind === "open");
export const wonStageValues = crmConfig.dealStages.filter((s) => s.kind === "won").map((s) => s.value);
export const openStageValues = openStages.map((s) => s.value);

export function findOption<T extends Option>(options: readonly T[], value: string | null | undefined) {
  return options.find((o) => o.value === value);
}

export function optionLabel(options: readonly Option[], value: string | null | undefined) {
  if (!value) return "";
  return findOption(options, value)?.label ?? value;
}

export function getStage(value: string | null | undefined): DealStage | undefined {
  return findOption(crmConfig.dealStages, value);
}
