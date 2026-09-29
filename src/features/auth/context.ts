import { createContext } from "react";
import type { AuthUser } from "./api";

export type AuthContextValue = {
  user: AuthUser | null;
  /** True until the first session check finishes. */
  loading: boolean;
  /** Set when the auth API itself is unreachable or misconfigured. */
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
