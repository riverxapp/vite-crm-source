import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { promisify } from "node:util";
import { createClient, type Client } from "@libsql/client";

/**
 * Server-side auth for the CRM. Runs only on the server (Vite middleware in
 * dev, a Vercel function in production) with the private TURSO_* credentials.
 *
 *   POST /api/auth/signup  { name, email, password }
 *   POST /api/auth/login   { email, password }
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *
 * Passwords are scrypt-hashed. Sessions are random 32-byte tokens sent as an
 * httpOnly cookie; only their SHA-256 is stored. The browser Data API proxy
 * refuses any SQL touching auth_* tables.
 */

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const COOKIE = "crm_session";
const SESSION_DAYS = 30;
const MAX_BODY_BYTES = 16 * 1024;

export type Env = { url?: string; authToken?: string };
type User = { id: number; name: string; email: string };
type HttpError = Error & { status: number };

const httpError = (status: number, message: string) => Object.assign(new Error(message), { status }) as HttpError;

let client: Client | null = null;
export function getDb(env: Env) {
  if (!env.url) throw httpError(503, "Auth is not configured: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on the server.");
  client ??= createClient({ url: env.url, authToken: env.authToken });
  return client;
}

// --- password + token helpers ------------------------------------------------

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Verifying against a throwaway hash keeps unknown-email logins as slow as real ones.
const DUMMY_HASH = hashPassword("not-a-real-password");

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// --- tiny best-effort rate limit (per server instance) ------------------------

const attempts = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, limit = 10, windowMs = 15 * 60_000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) throw httpError(429, "Too many attempts. Try again in a few minutes.");
}

// --- http helpers -------------------------------------------------------------

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (!String(req.headers["content-type"] ?? "").includes("application/json")) {
    // Also blocks cross-site form posts, which cannot send application/json.
    throw httpError(415, "Expected application/json");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw httpError(413, "Request too large");
    chunks.push(chunk as Buffer);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    return body && typeof body === "object" ? body : {};
  } catch {
    throw httpError(400, "Invalid JSON");
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | string[]> = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function readCookie(req: IncomingMessage, name: string) {
  const header = req.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function sessionCookie(req: IncomingMessage, token: string, maxAgeSeconds: number) {
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
  return [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

const clientIp = (req: IncomingMessage) =>
  String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || req.socket.remoteAddress || "unknown";

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- session store ------------------------------------------------------------

async function createSession(db: Client, userId: number) {
  const token = randomBytes(32).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  await db.execute({
    sql: "insert into auth_sessions (id, user_id, expires_at, created_at) values (?, ?, ?, ?)",
    args: [sha256(token), userId, now + SESSION_DAYS * 86400, now],
  });
  return token;
}

export async function userFromSession(db: Client, req: IncomingMessage): Promise<User | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const rs = await db.execute({
    sql: `select u.id, u.name, u.email from auth_sessions s
          join auth_users u on u.id = s.user_id
          where s.id = ? and s.expires_at > ?`,
    args: [sha256(token), Math.floor(Date.now() / 1000)],
  });
  const row = rs.rows[0];
  return row ? { id: Number(row.id), name: String(row.name), email: String(row.email) } : null;
}

// --- routes -------------------------------------------------------------------

async function signup(db: Client, req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req);
  const name = str(body.name).trim().slice(0, 120);
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  rateLimit(`signup:${clientIp(req)}`, 20);
  if (!name) throw httpError(400, "Enter your name.");
  if (!validEmail(email)) throw httpError(400, "Enter a valid email.");
  if (password.length < 8 || password.length > 200) throw httpError(400, "Use a password of at least 8 characters.");

  const existing = await db.execute({ sql: "select 1 from auth_users where email = ?", args: [email] });
  if (existing.rows.length) throw httpError(409, "An account with this email already exists. Log in instead.");

  const now = Math.floor(Date.now() / 1000);
  const rs = await db.execute({
    sql: "insert into auth_users (name, email, password_hash, created_at) values (?, ?, ?, ?) returning id",
    args: [name, email, await hashPassword(password), now],
  });
  const user: User = { id: Number(rs.rows[0].id), name, email };
  const token = await createSession(db, user.id);
  send(res, 201, { user }, { "Set-Cookie": sessionCookie(req, token, SESSION_DAYS * 86400) });
}

async function login(db: Client, req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req);
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  rateLimit(`login:${clientIp(req)}:${email}`);

  const rs = await db.execute({ sql: "select id, name, email, password_hash from auth_users where email = ?", args: [email] });
  const row = rs.rows[0];
  const ok = row ? await verifyPassword(password, String(row.password_hash)) : (await verifyPassword(password, await DUMMY_HASH), false);
  if (!row || !ok) throw httpError(401, "Email or password is incorrect.");

  const user: User = { id: Number(row.id), name: String(row.name), email: String(row.email) };
  const token = await createSession(db, user.id);
  send(res, 200, { user }, { "Set-Cookie": sessionCookie(req, token, SESSION_DAYS * 86400) });
}

async function logout(db: Client, req: IncomingMessage, res: ServerResponse) {
  const token = readCookie(req, COOKIE);
  if (token) await db.execute({ sql: "delete from auth_sessions where id = ?", args: [sha256(token)] });
  send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(req, "", 0) });
}

/** Handles /api/auth/:action. Returns false when the path is not an auth route. */
export async function handleAuthRequest(req: IncomingMessage, res: ServerResponse, env: Env): Promise<boolean> {
  const path = (req.url ?? "").split("?")[0].replace(/\/+$/, "");
  const action = path.match(/^\/api\/auth\/([a-z]+)$/)?.[1];
  if (!action) return false;

  try {
    const db = getDb(env);
    if (action === "me" && req.method === "GET") {
      send(res, 200, { user: await userFromSession(db, req) });
    } else if (req.method !== "POST") {
      throw httpError(405, "Method not allowed");
    } else if (action === "signup") {
      await signup(db, req, res);
    } else if (action === "login") {
      await login(db, req, res);
    } else if (action === "logout") {
      await logout(db, req, res);
    } else {
      throw httpError(404, "Not found");
    }
  } catch (error) {
    const status = (error as HttpError).status ?? 500;
    if (status === 500) console.error("[auth]", error);
    send(res, status, { error: status === 500 ? "Something went wrong. Try again." : (error as Error).message });
  }
  return true;
}
