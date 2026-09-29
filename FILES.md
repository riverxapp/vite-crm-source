# FILES.md

Structural index for the CRM template.

## Entry points

- `index.html`: Vite HTML entry (loads fonts and `/src/main.tsx`). Required by Vite.
- `src/main.tsx`: React mount.
- `src/app/App.tsx`: providers (theme, auth, tooltips, toasts) + router.
- `src/app/routes.tsx`: every route. `/`, `/login`, `/signup` are public; `/app/*` requires a session (app pages are lazy-loaded).
- `src/app/DatabaseGate.tsx`: shows setup instructions when no database is configured.

## Source areas

| Area | Path | Responsibility |
|---|---|---|
| CRM config | `src/config/crm.ts` | Labels, stages, statuses, industries, currency: the file to edit to adapt the CRM |
| Database | `src/db/` | `schema.ts` (all tables), `client.ts` (Drizzle over the Data API), `helpers.ts` (search, paging types) |
| Features | `src/features/<entity>/` | `api.ts` data access + entity dialogs/components for companies, contacts, deals, activities, dashboard, auth |
| Pages | `src/pages/` | Route-level views: landing, auth, dashboard, lists, details, tasks, settings, 404 |
| App shell | `src/components/layout/` | Sidebar layout, nav items, brand mark, theme toggle |
| Public site | `src/components/site/` | Site header, footer, landing product preview |
| CRM building blocks | `src/components/crm/` | Page header, badges, pickers, dialogs, pager, empty/error states |
| UI primitives | `src/components/ui/` | The shadcn components in use, restyled to `DESIGN.md`: alert-dialog, button, card, checkbox, command, dialog, dropdown-menu, input, label, popover, select, sheet, skeleton, spinner, table, tabs, textarea, toaster |
| Icons | `src/components/icons.ts` | The 42 icons the app uses, inlined from Lucide (ISC). Add new ones here |
| Hooks | `src/hooks/` | `use-form` (form state + validation), `use-async`, `use-mutation`, `use-list-params` (URL state), `use-debounced-value` |
| Libs | `src/lib/` | `env.ts` (only place env is read), `api.ts` (HTTP), `format.ts` (money, `Intl` dates, names), `toast.ts` (toast store), `utils.ts` |
| Styles | `src/styles/globals.css` | Design tokens (light/dark) + `rx-*` helper classes |

## Server

| Path | Responsibility |
|---|---|
| `server/auth.ts` | Auth API handler: signup, login, logout, me. scrypt hashes, DB-backed sessions |
| `server/db.ts` | Data API handler and SQL guard, shared by the local proxy and `/api/db` |
| `api/auth/[action].ts` | Vercel function wrapping `server/auth.ts` |
| `api/db/[action].ts` | Vercel function serving the Data API at `/api/db/*`, session-checked |
| `scripts/local-auth-api.ts` | Serves `/api/auth/*` from the Vite dev/preview server |
| `scripts/local-db-proxy.ts` | Local stand-in for the RiverX Data API (`/__local-db/v1`) |

## Root config

`package.json` (includes `pnpm.overrides` that keep a single `esbuild`), `vite.config.ts` (SWC React plugin + local DB proxy + local auth API), `tsconfig.json`, `tailwind.config.js`, `postcss.config.js` (Tailwind only), `components.json`, `drizzle.config.ts`, `vercel.json`, `.env.example`.

## Other scripts

- `scripts/dev-supervisor.js`, `scripts/git-poll.js`, `scripts/verify-dev-runtime.js`: RiverX runtime helpers.
- `scripts/error-reporter.ts`: browser error forwarding helper.
- `scripts/db-init.js`: Postgres migration helper (not used for Turso).

## Docs

`README.md` (overview), `RULES.md` (placement rules), `DATABASE.md` (data rules), `DESIGN.md` (visual system).
