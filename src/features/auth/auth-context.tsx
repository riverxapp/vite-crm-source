import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "./api";
import type { AuthUser } from "./api";
import { AuthContext } from "./context";

// Only a component is exported here so React Fast Refresh can hot-swap it.
// The hook lives in ./use-auth, the context in ./context.
export function AuthProviderRoot({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .fetchSession()
      .then(setUser)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await authApi.signIn(email, password));
    setError(null);
  }, []);
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setUser(await authApi.signUp(name, email, password));
    setError(null);
  }, []);
  const signOut = useCallback(async () => {
    await authApi.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, error, signIn, signUp, signOut }), [user, loading, error, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
