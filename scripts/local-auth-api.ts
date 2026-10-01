import type { Plugin } from "vite";
import { handleAuthRequest } from "../server/auth";
import { loadTursoEnv } from "./local-db-proxy";

/**
 * Serves the auth API from the Vite dev and preview servers, so login works
 * locally exactly as it does behind the Vercel function. The dev server uses
 * /__local-api/auth/* (a RiverX workspace preview sends /api/* to RiverX, not
 * the app); `vite preview` serves a production build, which calls /api/auth/*.
 */
export function localAuthApi(): Plugin {
  let env: { url?: string; authToken?: string } = {};

  const middleware =
    (prefix: string) =>
    (req: Parameters<typeof handleAuthRequest>[0], res: Parameters<typeof handleAuthRequest>[1], next: () => void) => {
      if (!req.url?.startsWith(`${prefix}/auth/`)) return next();
      // handleAuthRequest routes on /api/auth/:action.
      req.url = `/api${req.url.slice(prefix.length)}`;
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
      server.middlewares.use(middleware("/__local-api"));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware("/api"));
    },
  };
}
