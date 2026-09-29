import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type Client, type InStatement, type ResultSet } from "@libsql/client";
import { loadEnv, type Plugin } from "vite";

/**
 * Local stand-in for the RiverX Data API, for running this app outside RiverX.
 *
 * Active only in `vite dev`, only when TURSO_DATABASE_URL is set and
 * VITE_RIVERX_DB_URL is not. The Turso token stays in this Node process; the
 * browser gets a random per-process key and talks to /__local-db/v1 with the
 * same request/response contract as the real Data API (see DATABASE.md).
 */

const BASE_PATH = "/__local-db/v1";
const MAX_ROWS = 1000;

type Method = "run" | "all" | "get" | "values";
type Query = { sql: string; params?: unknown[]; method?: Method };

const BLOCKED = [
  // Auth tables are server-only (server/auth.ts); the browser never reads them.
  /\bauth_(users|sessions)\b/i,
  /^\s*(create|alter|drop|truncate|rename|reindex|attach|detach|vacuum)\b/i,
  /\bload_extension\s*\(/i,
  /^\s*pragma\b[^;]*=/i,
  /\b(insert\s+into|update|delete\s+from)\s+["'`]?(sqlite_|libsql_|__drizzle)/i,
];

function assertAllowed(sql: string) {
  if (/\bauth_(users|sessions)\b/i.test(sql)) {
    throw Object.assign(new Error("Auth tables are not accessible from the browser"), { status: 403 });
  }
  const withoutTrailing = sql.trim().replace(/;\s*$/, "");
  if (withoutTrailing.includes(";")) throw Object.assign(new Error("Multiple statements are not allowed"), { status: 403 });
  if (BLOCKED.some((re) => re.test(withoutTrailing))) {
    throw Object.assign(new Error("Statement blocked: schema changes go through drizzle-kit"), { status: 403 });
  }
}

function toResponse(rs: ResultSet) {
  const rows = rs.rows.slice(0, MAX_ROWS).map((row) => rs.columns.map((_, i) => row[i]));
  return {
    rows,
    rowsAffected: rs.rowsAffected,
    lastInsertRowid: rs.lastInsertRowid === undefined ? undefined : Number(rs.lastInsertRowid),
    truncated: rs.rows.length > MAX_ROWS,
  };
}

function toStatement(q: Query): InStatement {
  assertAllowed(q.sql);
  return { sql: q.sql, args: (q.params ?? []) as never };
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** TURSO_* from the process env first, then .env / .env.local (never VITE_-prefixed). */
export function loadTursoEnv(mode: string) {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  return {
    url: process.env.TURSO_DATABASE_URL || fileEnv.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || fileEnv.TURSO_AUTH_TOKEN,
    riverxDbUrl: fileEnv.VITE_RIVERX_DB_URL,
  };
}

export function localDbProxy(): Plugin {
  let client: Client | null = null;
  // Survive config restarts: reuse the key this plugin already injected.
  const key =
    process.env.VITE_RIVERX_DB_URL === BASE_PATH && process.env.VITE_RIVERX_DB_KEY
      ? process.env.VITE_RIVERX_DB_KEY
      : `local_${randomBytes(16).toString("hex")}`;

  return {
    name: "local-db-proxy",
    apply: "serve",
    config(_, { mode }) {
      const { url, authToken, riverxDbUrl } = loadTursoEnv(mode);
      const injectedByUs = process.env.VITE_RIVERX_DB_URL === BASE_PATH;
      if (!url || riverxDbUrl || (process.env.VITE_RIVERX_DB_URL && !injectedByUs)) return;

      client = createClient({ url, authToken });
      // Vite reads VITE_* from process.env after config hooks run.
      process.env.VITE_RIVERX_DB_URL = BASE_PATH;
      process.env.VITE_RIVERX_DB_KEY = key;
    },
    configureServer(server) {
      if (!client) return;
      const db = client;
      server.config.logger.info(`  ➜  Local DB proxy: ${BASE_PATH} → Turso`);

      server.middlewares.use(BASE_PATH, async (req, res) => {
        try {
          if (req.headers["x-riverx-key"] !== key) return send(res, 401, { error: "Invalid key", code: "unauthorized" });

          if (req.method === "GET" && req.url?.startsWith("/health")) {
            await db.execute("select 1");
            return send(res, 200, { ok: true, mode: "local-proxy" });
          }
          if (req.method !== "POST") return send(res, 405, { error: "Method not allowed", code: "method" });

          const body = await readJson(req);
          if (req.url?.startsWith("/query")) {
            return send(res, 200, toResponse(await db.execute(toStatement(body as Query))));
          }
          if (req.url?.startsWith("/batch")) {
            const queries = (body.queries ?? []) as Query[];
            const results = await db.batch(queries.map(toStatement), "write");
            return send(res, 200, { results: results.map(toResponse) });
          }
          send(res, 404, { error: "Not found", code: "not_found" });
        } catch (error) {
          const status = (error as { status?: number }).status ?? 400;
          send(res, status, { error: error instanceof Error ? error.message : String(error), code: "query_failed" });
        }
      });
    },
  };
}
