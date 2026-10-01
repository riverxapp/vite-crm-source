import type { IncomingMessage, ServerResponse } from "node:http";
import { getDb, userFromSession } from "../../server/auth.js";
import { handleDbRequest, send } from "../../server/db.js";

// Vercel Node function for /api/db/:action — the Data API for every production
// build, including apps published from RiverX. Requires a logged-in session cookie; uses the
// same server-only TURSO_DATABASE_URL / TURSO_AUTH_TOKEN as /api/auth/*.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const action = (req.url ?? "").split("?")[0].match(/^\/api\/db\/([a-z]+)\/?$/)?.[1] ?? "";
  try {
    const db = getDb({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    if (!(await userFromSession(db, req))) return send(res, 401, { error: "Log in to continue.", code: "unauthorized" });
    await handleDbRequest(db, action, req, res, "vercel-function");
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    if (status === 500) console.error("[db]", error);
    send(res, status, { error: status === 500 ? "Something went wrong. Try again." : (error as Error).message });
  }
}
