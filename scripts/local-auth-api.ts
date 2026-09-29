import type { Plugin } from "vite";
import { handleAuthRequest } from "../server/auth";
import { loadTursoEnv } from "./local-db-proxy";

/**
 * Serves the auth API (/api/auth/*) from the Vite dev and preview servers, so
 * login works locally exactly as it does behind the Vercel function.
 */
export function localAuthApi(): Plugin {
  let env: { url?: string; authToken?: string } = {};

  const middleware = (req: Parameters<typeof handleAuthRequest>[0], res: Parameters<typeof handleAuthRequest>[1], next: () => void) => {
    if (!req.url?.startsWith("/api/auth/")) return next();
    handleAuthRequest(req, res, env).then((handled) => {
      if (!handled) next();
    }, next);
  };

  return {
    name: "local-auth-api",
    config(_, { mode }) {
      const { url, authToken } = loadTursoEnv(mode);
      env = { url, authToken };
    },
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
