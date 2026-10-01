# RiverX CRM

RiverX CRM is a generic, company-based CRM template: companies, contacts, deals (pipeline board), activities and tasks, with a dashboard, a public landing page and email/password auth. Vite 6 + React + TypeScript + Tailwind + a trimmed set of shadcn/ui primitives, backed by **Turso** (libSQL) through Drizzle ORM.

It is built to run cheaply in dev mode inside shared workspaces: 18 runtime dependencies, one `esbuild`, SWC instead of Babel, and small in-repo replacements for the usual icon, date, form, toast and chart libraries (see [Dependency budget](#dependency-budget)).

## Quick start

```bash
pnpm install
cp .env.example .env        # then fill TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
pnpm db:push                # create tables in Turso
pnpm dev                    # http://localhost:5173
```

Open `/`, sign up, and you land in the dashboard at `/app`.

## Make it yours

Everything business-specific lives in **`src/config/crm.ts`**:

- entity labels (rename "Deals" → "Opportunities", "Companies" → "Accounts", …)
- pipeline stages with win probability and open / won / lost kind
- company lifecycles, sizes, industries, contact statuses, activity types
- currency, locale and page size

Stored values are the option `value` keys. Renaming a label is safe; changing a `value` orphans rows that use the old key. The app name comes from `VITE_APP_NAME`.

## Features

| Area | What you get |
|---|---|
| Dashboard | Open and weighted pipeline, won this month, counts, pipeline-by-stage chart, upcoming tasks, recent activity |
| Companies | Searchable, filterable, paginated list; detail with contacts, deals and activity timeline |
| Contacts | List + detail, linked to a company, with their deals and timeline |
| Deals | Drag-and-drop board by stage (with a menu fallback) and a list view; detail with stage progress |
| Activities | Log notes, calls, emails and meetings on any record; tasks with due dates and overdue state |
| Auth | Sign up, log in, log out. Server-side sessions in httpOnly cookies |
| UI | Light and dark themes, responsive down to phone width, design system in `DESIGN.md` |
| Footprint | Low dev-mode memory and payload; see Dependency budget |

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | Dev server with the local DB proxy and auth API |
| `pnpm build` / `pnpm preview` | Production build / serve it. `pnpm dev` serves auth at `/__local-api/auth/*`; `preview` serves `/api/auth` but not `/api/db`, so data pages need `pnpm dev` or a Vercel deploy |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:push` | Apply `src/db/schema.ts` to Turso |
| `pnpm db:studio` | Browse the database with Drizzle Studio |
| `pnpm verify:dev-runtime` | Check the dev-server defaults (host, port, strict port) |

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_APP_NAME` | browser | App name (default `RiverX CRM`) |
| `VITE_API_BASE_URL` | browser | Base for `src/lib/api.ts` (default `/__local-api` in `pnpm dev`, `/api` in production builds). Never point the dev server at `/api`: a RiverX workspace preview routes `/api/*` to RiverX |
| `VITE_RIVERX_DB_URL` / `VITE_RIVERX_DB_KEY` | browser | RiverX Data API. Injected by RiverX; leave empty locally and on your own Vercel project |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | **server only** | drizzle-kit, the local DB proxy, and the auth and data API functions. Never prefix with `VITE_` |

`.env` / `.env.*` are gitignored.

## How data flows

```
browser ── Drizzle (sqlite-proxy) ──▶ Data API ──▶ Turso        CRM tables
browser ── auth API (cookie)      ──▶ server/auth.ts ──▶ Turso  auth_* tables
```

The browser code is the same everywhere; only the Data API behind it changes:

| Where | Data API | Authorised by |
|---|---|---|
| RiverX | RiverX's hosted endpoint, from `VITE_RIVERX_DB_URL` (see `DATABASE.md`) | Publishable key `VITE_RIVERX_DB_KEY` |
| `pnpm dev`, no RiverX | `/__local-db/v1`, served by `scripts/local-db-proxy.ts` when `TURSO_*` are set | Random per-process key |
| Production build, no RiverX (e.g. Vercel) | `/api/db/*`, served by `api/db/[action].ts` | Login session cookie |

- The local proxy and `/api/db` share `server/db.ts`: the same contract and SQL guard (no DDL, one statement per query, no SQL touching `auth_*` tables). The Turso token stays on the server.
- **Auth** runs only on the server: Vite middleware in dev (`scripts/local-auth-api.ts`) and a Vercel function in production (`api/auth/[action].ts`). Both share `server/auth.ts`.

## Deploying

The build is a static SPA plus two serverless functions (`/api/auth/*`, `/api/db/*`). `vercel.json` rewrites client routes to `index.html`.

1. In Vercel → Project → Settings → Environment Variables, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (server-only, no `VITE_` prefix) for each environment you deploy.
2. Run `pnpm db:push` against that database once so the tables exist.
3. Leave `VITE_RIVERX_DB_*` unset: CRM data then goes through `/api/db`. Under RiverX, its injected `VITE_RIVERX_DB_*` take precedence.
4. Redeploy after changing env vars. `VITE_*` values are inlined at build time.

`package.json` sets `"type": "module"`, so Vercel runs the functions as native ES modules. Relative imports in `api/` and `server/` must end in `.js` (`from "../../server/auth.js"`); without it the function fails to load with `FUNCTION_INVOCATION_FAILED`.

| Symptom on Vercel | Cause / fix |
|---|---|
| `FUNCTION_INVOCATION_FAILED` | Usually a relative import without `.js` in `api/` or `server/`. Check the function logs for `ERR_MODULE_NOT_FOUND` |
| Auth returns 503 "Auth is not configured" | `TURSO_*` missing from that environment's variables |
| "Connect a database to get started" | The deployed build predates `/api/db`. Redeploy from the current `main` |
| Data requests return 401 "Log in to continue." | No valid session cookie. Log in again |
| Errors like `no such table` | Run `pnpm db:push` against the production database |

## Security notes

- **Under RiverX's Data API, CRM data is not protected by login.** The key ships in the browser bundle, so anyone with the app URL can read and write CRM tables directly. `/api/db` requires a session instead, but signup is open and every signed-in user can run any allowed SQL on all CRM rows. Before storing real customer data, restrict signup and move to per-route server queries.
- Under RiverX's hosted Data API, the `auth_*` tables are readable with the public key. Passwords are scrypt-hashed and only session-token hashes are stored, but for real deployments keep auth in a database the public key cannot reach.

## Dependency budget

Dev mode is what runs in the workspaces, so every package has to earn its place. Measured with a fresh dev server and cache disabled:

| | Before trimming | Now |
|---|---|---|
| `node_modules` | 324 MB, 305 packages | 129 MB, 181 packages |
| Runtime dependencies | 49 | 18 |
| Landing page, dev | 84 requests, 4.3 MB | 75 requests, 2.4 MB |
| Dashboard, dev | 117 requests, 5.8 MB | 94 requests, 2.7 MB |
| Dev server memory (idle → peak) | 157 → 245 MB | 98 → 176 MB |
| Production JS (main chunk) | 509 KB | 389 KB |

What replaced what:

| Instead of | Use | Why |
|---|---|---|
| `lucide-react` | `src/components/icons.ts` | Dev mode pre-bundled all 1,947 icons (1.4 MB per page load, 38 MB on disk) for the 42 we use |
| `date-fns` | `Intl` helpers in `src/lib/format.ts` | Six functions; 53 MB on disk with its jalali copy |
| `react-hook-form` (+ `zod`, resolvers) | `src/hooks/use-form.ts` | Same API subset (`register`, `Controller`, `handleSubmit`, `reset`, `watch`) in ~100 lines |
| `sonner` | `src/lib/toast.ts` + `ui/toaster.tsx` | `toast.success` / `toast.error` only |
| `recharts` | `src/features/dashboard/PipelineChart.tsx` | One single-series bar chart; recharts was 1.26 MB in dev |
| `@radix-ui/react-label` | native `<label>` | No behaviour needed |
| `@vitejs/plugin-react` (Babel) | `@vitejs/plugin-react-swc` | ~40% less idle memory, less CPU per transform, drops Babel + browserslist data |
| `autoprefixer` | — | Target browsers need no prefixes; it ran on every CSS change |
| 37 unused shadcn components | deleted | They were the only users of 26 packages |

Kept on purpose: `react`, `react-dom`, `react-router-dom`, `drizzle-orm`, `@libsql/client` (server only), `tailwind-merge` (class overrides depend on it), `class-variance-authority`, `clsx`, `next-themes` (3 KB, no-flash theme), `cmdk` (12 KB, keyboard nav for the record pickers), and the Radix primitives that provide accessible dialog, alert dialog, popover, dropdown menu, select, tabs, checkbox and slot.

`package.json` pins `drizzle-kit`'s internal `esbuild` copies (`pnpm.overrides`) to the version Vite uses, so only one `esbuild` binary is installed. Before adding a dependency, check `RULES.md`.

## Project structure

See `FILES.md`. Placement rules are in `RULES.md`; database rules are in `DATABASE.md`; visual rules are in `DESIGN.md`.
