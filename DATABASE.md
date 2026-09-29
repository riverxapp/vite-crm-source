# DATABASE.md

How to add and use a database in a RiverX Vite app.

RiverX gives each project an optional **Turso (libSQL / SQLite)** database. The app never talks to Turso directly. It sends queries to the **RiverX Data API**, which holds the real Turso credentials server-side. You write queries with **Drizzle ORM** (`drizzle-orm/sqlite-proxy`).

```
browser app ──POST {VITE_RIVERX_DB_URL}/query──▶ RiverX Data API ──▶ Turso
               x-riverx-key: {VITE_RIVERX_DB_KEY}
```

> [!WARNING]
> **Anyone who visits your app can read and write this database.** The publishable key ships in the JS bundle, and there is no row-level security or end-user auth. The Data API blocks destructive statements, but it does not stop `SELECT * FROM <table>`.
> **Never store passwords, secrets, tokens, or personal data (PII) in it.**

---

## 1. Turn it on

The database is created on demand, not by default.

1. Open the project preview in RiverX and go to the **Data** tab.
2. Click **Create database**.
3. RiverX provisions the database and injects the connection env vars (below) into the preview and the published build.

Until that happens, the env vars are empty. The client in step 4 handles this, so the app still boots.

## 2. Environment variables

All of these are **injected by the platform. Do not edit `.env.local` by hand**, and never commit it.

| Variable | Where it exists | Used by |
|---|---|---|
| `VITE_RIVERX_DB_URL` | `.env.local`, Vite env, Vercel env | App (browser). Data API base URL, e.g. `https://agent.riverx.app/db/v1` |
| `VITE_RIVERX_DB_KEY` | `.env.local`, Vite env, Vercel env | App (browser). Publishable key `rxdb_pk_…`, safe to ship |
| `TURSO_DATABASE_URL` | Process env of the dev server and workspace terminal **only** | `drizzle-kit` (schema changes) |
| `TURSO_AUTH_TOKEN` | Process env of the dev server and workspace terminal **only** | `drizzle-kit` (schema changes) |

`TURSO_*` values are full-access credentials. They are never written to disk. Never read them from `src/`, never copy them into a file, and never prefix them with `VITE_`.

Make sure `.gitignore` contains:

```gitignore
.env
.env.*
!.env.example
```

Add the public vars to `.env.example` (empty values):

```bash
VITE_RIVERX_DB_URL=
VITE_RIVERX_DB_KEY=
```

## 3. Install

```bash
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

`@libsql/client` is used by `drizzle-kit`, the local dev proxy and the server auth API (a runtime dependency because the Vercel function needs it). **Never import it from `src/`**: it would bypass the Data API and needs the private token.

## 4. Files

### `src/lib/env.ts`: expose the vars

Per `RULES.md`, env vars are read only here.

```ts
export const env = {
  // ...existing fields
  dbUrl: import.meta.env.VITE_RIVERX_DB_URL || "",
  dbKey: import.meta.env.VITE_RIVERX_DB_KEY || "",
};
```

### `src/db/schema.ts`: tables

All tables live in this one file.

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

### `src/db/client.ts`: the `db` instance

Copy this as-is. The response shapes are strict: see [Why the shapes matter](#why-the-shapes-matter).

```ts
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { apiRequest } from "@/lib/api";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Method = "run" | "all" | "get" | "values";

type QueryResult = {
  rows: unknown[];
  rowsAffected?: number;
  lastInsertRowid?: number;
  truncated?: boolean;
};

export const isDatabaseConfigured = Boolean(env.dbUrl && env.dbKey);

// Absolute, so apiRequest never prefixes it with the API base URL (matters for
// the relative URL of the local dev proxy).
const dbBaseUrl = env.dbUrl ? new URL(env.dbUrl, window.location.origin).href.replace(/\/$/, "") : "";

function post<T>(path: string, body: unknown) {
  if (!isDatabaseConfigured) {
    throw new Error("Database is not configured. Create one from the RiverX Data tab.");
  }
  return apiRequest<T>(`${dbBaseUrl}/${path}`, {
    method: "POST",
    headers: { "x-riverx-key": env.dbKey },
    body,
  });
}

// drizzle maps rows by position: 'all'/'values' need unknown[][], 'get' needs one flat unknown[].
function shape(result: QueryResult, method: Method) {
  if (method === "run") return { rows: [] };
  if (method === "get") {
    const first = result.rows[0];
    return { rows: (Array.isArray(first) ? first : result.rows) as unknown[] };
  }
  return { rows: result.rows };
}

export const db = drizzle(
  async (sql, params, method) => {
    const result = await post<QueryResult>("query", { sql, params, method });
    return shape(result, method);
  },
  async (queries) => {
    const { results } = await post<{ results: QueryResult[] }>("batch", { queries });
    return results.map((result, i) => shape(result, queries[i].method));
  },
  { schema },
);
```

### `drizzle.config.ts`: schema tooling

This uses the **direct Turso connection**, not the proxy, because `drizzle-kit` can't push through `sqlite-proxy`.

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

## 5. Changing the schema

1. Edit `src/db/schema.ts`.
2. In the **workspace terminal**, where `TURSO_*` are available, run:

   ```bash
   pnpm exec drizzle-kit push
   ```

3. Check the result in the **Data** tab.

Rules:

- **Schema changes happen only through `drizzle-kit`.** `CREATE`/`ALTER`/`DROP` from app code is always rejected by the Data API, and the Data tab blocks DDL too.
- **Preview and the published app share the same database.** A push changes production data too.
- `drizzle-kit push` **will drop columns and tables** if you remove them from the schema. Before any destructive change (dropping or renaming a column or table, changing a type), stop and confirm with the user.
- Do not seed or bulk-insert data unless the user asks for it.

## 6. Querying

Import `db` and the tables, and write normal Drizzle queries:

```ts
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { todos } from "@/db/schema";

// read
const all = await db.select().from(todos).orderBy(desc(todos.createdAt));
const one = await db.select().from(todos).where(eq(todos.id, 1)).get();

// write
const [created] = await db.insert(todos).values({ title: "Ship it" }).returning();
await db.update(todos).set({ done: true }).where(eq(todos.id, created.id));
await db.delete(todos).where(eq(todos.id, created.id));
```

### Atomic multi-step writes: use `db.batch`, never `db.transaction`

`db.transaction()` is **not supported** by `sqlite-proxy` and throws at runtime. Use `db.batch()`, which Turso runs in one implicit transaction: all statements succeed or none do.

```ts
await db.batch([
  db.insert(todos).values({ title: "A" }),
  db.update(todos).set({ done: true }).where(eq(todos.id, 7)),
]);
```

### In React components

Query in effects or data hooks, not during render. Gate database features on `isDatabaseConfigured`:

```tsx
import { useEffect, useState } from "react";
import { db, isDatabaseConfigured } from "@/db/client";
import { todos, type Todo } from "@/db/schema";

export function TodoList() {
  const [items, setItems] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDatabaseConfigured) return;
    db.select().from(todos).then(setItems).catch((e) => setError(String(e)));
  }, []);

  if (!isDatabaseConfigured) return <p>Database not set up yet.</p>;
  if (error) return <p>Could not load todos.</p>;
  return <ul>{items.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

## 7. Limits and blocked statements

Enforced by the Data API on every request:

| Limit | Default |
|---|---|
| Rows returned per query | 1,000 (extra rows are cut and the response has `truncated: true`, so paginate with `.limit()` / `.offset()`) |
| SQL length | 20,000 characters |
| Rate limit | 600 queries / minute per project |
| Query timeout | 15 seconds |
| Statements per `query` call | 1 (use `db.batch` for more) |

Always rejected: DDL (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME`, `REINDEX`), `ATTACH`/`DETACH`, `VACUUM INTO`, `LOAD_EXTENSION`, `PRAGMA` writes, multiple statements in one call, and writes to `sqlite_*`, `libsql_*` and `__drizzle*` tables.

Errors come back as `{ error, code }` and surface as thrown errors from `apiRequest`.

| Status | Meaning |
|---|---|
| 401 | Missing or invalid `x-riverx-key` |
| 403 | Statement blocked by the guard, or origin not allowed |
| 429 | Rate limited, so back off and retry |

`GET {VITE_RIVERX_DB_URL}/health` (with `x-riverx-key`) returns liveness and the access mode. Use it for a connection check.

## 8. Publishing

- RiverX adds `VITE_RIVERX_DB_URL` / `VITE_RIVERX_DB_KEY` to the Vercel env **before** the build. Vite inlines `import.meta.env.VITE_*` at build time.
- The published domain and any custom domain are added to the database's allowed origins automatically.
- **Rotating the publishable key requires a redeploy.** The old key is baked into the existing bundle.

## 9. Running outside RiverX (local proxy)

With no RiverX Data API, put `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in a gitignored `.env` (or export them) and leave `VITE_RIVERX_DB_URL` empty. `pnpm dev` then serves the same Data API contract at `/__local-db/v1` (`scripts/local-db-proxy.ts`):

- The Turso token stays in the Vite Node process; the browser gets a random per-process key.
- The proxy applies the guard from section 7: DDL, multi-statement SQL, `PRAGMA` writes and internal-table writes are rejected.
- `src/db/client.ts` is unchanged; it resolves the relative URL against the page origin.
- `drizzle.config.ts` loads `.env.local` / `.env` itself, so `pnpm db:push` works too.

In a production build with no `VITE_RIVERX_DB_URL`, the app uses `/api/db` instead (`api/db/[action].ts`): the same contract and guard (`server/db.ts`), authorised by the login session cookie rather than `x-riverx-key`.

This proxy exists in dev only. `vite build` output never contains it or the token.

## 10. Auth tables (server-only)

`auth_users` and `auth_sessions` are defined in `schema.ts` but are read and written **only** by `server/auth.ts`, which runs on the server (Vite middleware in dev, `api/auth/[action].ts` on Vercel) with `TURSO_*`.

- Never query `auth_*` from `src/`. The local proxy rejects any SQL that mentions them.
- Passwords are scrypt-hashed. Session tokens live only in an httpOnly cookie; the table stores their SHA-256.
- **Caveat:** the hosted RiverX Data API does not know about this rule, so under RiverX the `auth_*` tables are readable with the publishable key. Hashes are not plaintext, but for production keep auth data where the public key cannot reach it.
- The server auth API needs `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` in the hosting environment (server-only, never `VITE_`).

## 11. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Database is not configured` | No database yet: create one from the **Data** tab. If you just created it, restart the preview. |
| Every field is `undefined` in results | Rows were returned as objects instead of positional arrays. Use the `client.ts` above unchanged. |
| `get()` returns nested garbage | `'get'` must return one flat array, not `[[...]]`. Use `shape()` above. |
| `db.transaction is not a function` / throws | Not supported. Use `db.batch([...])`. |
| 403 on `CREATE TABLE` | DDL is blocked at runtime. Change `schema.ts` and run `drizzle-kit push`. |
| `drizzle-kit push` can't connect | Run it in the RiverX workspace terminal, where `TURSO_*` are injected. They are not in `.env.local` by design. |
| Works in preview, CORS error on custom domain | The domain isn't in allowed origins yet. Re-attach the domain or republish. |
| Results stop at 1,000 rows | Row cap. Paginate. |

## Checklist for agents

- `db` comes from `src/db/client.ts`. Tables live in `src/db/schema.ts`.
- Apply schema changes with `pnpm exec drizzle-kit push`. There is no DDL at runtime.
- Use `db.batch([...])`, **never** `db.transaction()`.
- No secrets, passwords, or PII in the database: it is publicly readable and writable.
- Don't edit `.env.local`. Don't read `TURSO_*` from `src/`. Don't import `@libsql/client` in `src/`.
- Ask before destructive schema changes or seeding data.
- Never read or write `auth_*` tables from `src/`. Auth goes through `/api/auth/*`.
- `scripts/db-init.js` is the separate Postgres (`DATABASE_URL`) migration helper. It is **not** used for the Turso database.
