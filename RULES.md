# RULES.md

Change boundaries and placement rules for the CRM template.

## Product shape

- Vite + React SPA: public landing + auth pages, and the CRM under `/app`.
- CRM data goes through Drizzle over the Data API (`src/db/client.ts`).
- Auth goes through the server API (`server/auth.ts`); the browser never touches `auth_*` tables.
- Business vocabulary and options live in `src/config/crm.ts`, never hard-coded in pages.
- Dev-mode resource use is a product requirement: keep dependencies minimal (see Dependencies).

## Routing

1. Define routes in `src/app/routes.tsx`. App pages live under `/app` and are lazy-loaded.
2. Route-level views go in `src/pages`; shell composition goes in `src/components/layout`.
3. Internal links use `/app/...` paths.

## Data

1. Tables live only in `src/db/schema.ts`; change them with `pnpm db:push` (no runtime DDL).
2. Queries live in `src/features/<entity>/api.ts`; components call those functions, not `db` directly.
3. Use `db.batch([...])` for multi-step writes, never `db.transaction()`.
4. Paginate lists (`crmConfig.pageSize`); the Data API caps results at 1,000 rows.
5. Never import `@libsql/client` or read `TURSO_*` from `src/`. They belong to `server/`, `scripts/`, `api/` and `drizzle.config.ts` only.

## Components

1. Reusable primitives belong in `src/components/ui`; CRM building blocks in `src/components/crm`; icons in `src/components/icons.ts`.
2. Use named exports. Keep components small.
3. Follow `DESIGN.md` for every visual decision.

## Dependencies

Dev mode runs in shared workspaces, so the dependency list is kept deliberately short (see "Dependency budget" in `README.md`).

1. Before adding a package, check whether a few lines in `src/lib` or `src/hooks` would do. Add one only when it brings real behaviour (accessibility, a protocol, a data layer), not convenience.
2. Do not reintroduce the libraries that were replaced: `lucide-react` (use `src/components/icons.ts`), `date-fns` (use `Intl` helpers in `src/lib/format.ts`), `react-hook-form` / `zod` (use `src/hooks/use-form.ts`), `sonner` (use `src/lib/toast.ts`), `recharts` (hand-build the chart as in `PipelineChart.tsx`).
3. New icons: copy the SVG children from lucide.dev into a new `icon("name", [...])` line in `src/components/icons.ts`.
4. New shadcn components: add only the ones you use, restyle them to `DESIGN.md`, and remove the file and its dependency if they stop being used. The shadcn CLI installs `lucide-react` along with components: point their icon imports at `@/components/icons` and uninstall it.
5. Keep one `esbuild`: if you upgrade Vite or `drizzle-kit`, update `pnpm.overrides` in `package.json` so their versions still match, then check `ls node_modules/.pnpm | grep ^esbuild@`.
6. Keep `@vitejs/plugin-react-swc`; don't switch back to the Babel plugin.

## Env and HTTP

1. Read browser env only in `src/lib/env.ts`.
2. Route HTTP through `src/lib/api.ts`.

## AI editing

1. Preserve the folder structure. Avoid monolithic files and unrelated edits.
2. Add comments only when they clarify something non-obvious.
3. Keep `README.md`, `FILES.md`, `RULES.md`, `DATABASE.md` and `DESIGN.md` in sync with code changes.
4. Ask before destructive schema changes or seeding data.

## Scripts

Keep `scripts/dev-supervisor.js`, `scripts/git-poll.js`, `scripts/error-reporter.ts` and `scripts/db-init.js` unless explicitly asked. Script changes must preserve the Vite runtime assumptions.
