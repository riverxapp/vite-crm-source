import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAuthRequest } from "../../server/auth.js";

// Vercel Node function for /api/auth/:action. Set TURSO_DATABASE_URL and
// TURSO_AUTH_TOKEN (server-only, no VITE_ prefix) in the project's env.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handleAuthRequest(req, res, {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  if (!handled) {
    res.statusCode = 404;
    res.end();
  }
}
