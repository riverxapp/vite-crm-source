import { apiRequest } from "@/lib/api";

/** Talks to the server auth API (server/auth.ts). The session is an httpOnly cookie. */

export type AuthUser = { id: number; name: string; email: string };

type UserResponse = { user: AuthUser | null };

export async function fetchSession() {
  const { user } = await apiRequest<UserResponse>("auth/me");
  return user;
}

export async function signIn(email: string, password: string) {
  const { user } = await apiRequest<UserResponse>("auth/login", { method: "POST", body: { email, password } });
  return user!;
}

export async function signUp(name: string, email: string, password: string) {
  const { user } = await apiRequest<UserResponse>("auth/signup", { method: "POST", body: { name, email, password } });
  return user!;
}

export async function signOut() {
  await apiRequest("auth/logout", { method: "POST", body: {} });
}
