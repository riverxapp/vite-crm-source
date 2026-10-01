TITLE
Sales CRM

SLUG
sales-crm

TYPE
vite

DESCRIPTION
A sales CRM with a dashboard, a deal board you move by stage, and linked records for companies, contacts, calls, notes and tasks.

SOURCE REPO URL
https://github.com/riverxapp/vite-crm-source

REPO NAME
vite-crm-source

NEEDS A DATABASE
Yes

PREVIEW IMAGE
NEEDS INPUT

LIVE PREVIEW URL
NEEDS INPUT

SORT ORDER
0

DETAIL PAGE INTRO
You start with a working CRM behind a simple home page with sign-up: a dashboard, company and contact records, a deal board and a task list. Everything you add is saved. It suits anyone who sells to other businesses and wants to follow each relationship from first call to close in one place.

DETAIL SECTIONS
## What you get
A public home page with sign-up and log-in, then a signed-in workspace. The Dashboard shows open and weighted pipeline, deals won this month, a pipeline by stage chart, upcoming tasks and recent activity. Companies and Contacts each have a searchable, filterable list and a detail page with linked deals and a timeline. Deals has a board you drag between stages and a list view. Tasks shows open, overdue and completed follow-ups, and Settings lists your stages and statuses.

## Who it is for
Agencies, consultants and small sales teams that sell to other businesses and want every open deal in one place. It also fits founders tracking investors or partners, since Companies, Contacts and Deals can be renamed to Accounts, People or Opportunities. It is not a fit for selling directly to shoppers: there is no store, no checkout and no sending of emails, only a place to log them.

## Making it yours
Most people start by asking for their own pipeline stages, such as "rename Discovery to Demo booked and add a Contract sent stage". Next they change the lists to match their market: industries, company sizes and contact statuses. You can also ask to rename Deals to Opportunities, switch the currency, add a field like lead source to contacts, or change the home page headline to describe your business.

HIGHLIGHTS
Deal board with stages you drag deals between
Dashboard with pipeline totals and a stage chart
Companies, contacts and deals linked together
Sign-up and log-in already included

CAPABILITIES
Timeline for logging notes, calls, emails and meetings on any record
Tasks with due dates, an overdue view and a checkbox to complete them
Search and filters on the company, contact and deal lists
Win chance per stage, used for a weighted pipeline total
Light and dark themes that also work on phone screens

GETTING STARTED STEPS
Pick this template and describe your idea in one or two sentences.
Ask for your own pipeline stages, for example "add a Contract sent stage before Won".
Ask to rename Companies, Contacts or Deals to the words your team already uses.
Publish to get a live link you can share.

JSON
```json
{
  "title": "Sales CRM",
  "slug": "sales-crm",
  "type": "vite",
  "description": "A sales CRM with a dashboard, a deal board you move by stage, and linked records for companies, contacts, calls, notes and tasks.",
  "source_repo_url": "https://github.com/riverxapp/vite-crm-source",
  "repo_name": "vite-crm-source",
  "require_db": true,
  "preview_image_url": null,
  "preview_url": null,
  "sort_order": 0,
  "is_live": false,
  "detail_intro": "You start with a working CRM behind a simple home page with sign-up: a dashboard, company and contact records, a deal board and a task list. Everything you add is saved. It suits anyone who sells to other businesses and wants to follow each relationship from first call to close in one place.",
  "detail_sections": [
    { "title": "What you get", "body": "A public home page with sign-up and log-in, then a signed-in workspace. The Dashboard shows open and weighted pipeline, deals won this month, a pipeline by stage chart, upcoming tasks and recent activity. Companies and Contacts each have a searchable, filterable list and a detail page with linked deals and a timeline. Deals has a board you drag between stages and a list view. Tasks shows open, overdue and completed follow-ups, and Settings lists your stages and statuses." },
    { "title": "Who it is for", "body": "Agencies, consultants and small sales teams that sell to other businesses and want every open deal in one place. It also fits founders tracking investors or partners, since Companies, Contacts and Deals can be renamed to Accounts, People or Opportunities. It is not a fit for selling directly to shoppers: there is no store, no checkout and no sending of emails, only a place to log them." },
    { "title": "Making it yours", "body": "Most people start by asking for their own pipeline stages, such as \"rename Discovery to Demo booked and add a Contract sent stage\". Next they change the lists to match their market: industries, company sizes and contact statuses. You can also ask to rename Deals to Opportunities, switch the currency, add a field like lead source to contacts, or change the home page headline to describe your business." }
  ],
  "detail_highlights": [
    "Deal board with stages you drag deals between",
    "Dashboard with pipeline totals and a stage chart",
    "Companies, contacts and deals linked together",
    "Sign-up and log-in already included"
  ],
  "detail_capabilities": [
    "Timeline for logging notes, calls, emails and meetings on any record",
    "Tasks with due dates, an overdue view and a checkbox to complete them",
    "Search and filters on the company, contact and deal lists",
    "Win chance per stage, used for a weighted pipeline total",
    "Light and dark themes that also work on phone screens"
  ],
  "detail_getting_started": [
    "Pick this template and describe your idea in one or two sentences.",
    "Ask for your own pipeline stages, for example \"add a Contract sent stage before Won\".",
    "Ask to rename Companies, Contacts or Deals to the words your team already uses.",
    "Publish to get a live link you can share."
  ]
}
```

NOTES
- Title: the repo calls itself "RiverX CRM". "Sales CRM" is used instead because the prompt says not to name RiverX's own services. Check that the slug sales-crm is not already used in the catalogue.
- Preview image and live preview: neither is in the repo, so both are NEEDS INPUT (null in the JSON).
- Type (vite) and database need (yes) were read from the repo, not from inputs.
- Data privacy: nothing here calls the data private. The README and Settings page warn that any signed-in user can read and write all CRM data, and that sign-up is open. Keep privacy or security wording out of these fields.
- Not checked on screen: the drag-to-move deal board and email logging (logging only, no sending) come from the README and code, not a running preview.
- Character counts: description 129 (limit 160), intro 292 (limit 400), section word counts 78, 67 and 68, longest highlight 48 of 60, longest capability 69 of 80, longest getting-started step 85 of 110.
