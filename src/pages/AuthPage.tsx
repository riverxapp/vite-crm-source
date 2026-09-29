import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { crmConfig } from "@/config/crm";
import { useAuth } from "@/features/auth/use-auth";

type Mode = "login" | "signup";
type Values = { name: string; email: string; password: string };

const copy = {
  login: { title: "Log in", eyebrow: "Welcome back", submit: "Log in", switchText: "New here?", switchLink: "Create an account", switchTo: "/signup" },
  signup: { title: "Create your account", eyebrow: "Get started", submit: "Create account", switchText: "Already have an account?", switchLink: "Log in", switchTo: "/login" },
} as const;

function safeNext(next: string | null) {
  return next && next.startsWith("/app") ? next : "/app";
}

export function AuthPage({ mode }: { mode: Mode }) {
  const { user, loading, error: sessionError, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ defaultValues: { name: "", email: "", password: "" } });
  const text = copy[mode];

  if (!loading && user) return <Navigate to={next} replace />;

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setError(null);
    try {
      if (mode === "signup") await signUp(name, email, password);
      else await signIn(email, password);
      navigate(next, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  });

  const { errors } = formState;
  const switchHref = params.get("next") ? `${text.switchTo}?next=${encodeURIComponent(next)}` : text.switchTo;

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 bg-background items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm border bg-card" aria-labelledby="auth-title">
          <div className="border-b px-6 py-5">
            <p className="rx-meta rx-mark">{text.eyebrow}</p>
            <h1 id="auth-title" className="mt-2 text-[1.5rem] font-bold tracking-[-0.02em]">{text.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">to {crmConfig.appName}</p>
          </div>

          <div className="space-y-4 px-6 py-5">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Full name</Label>
                <Input id="auth-name" autoComplete="name" autoFocus {...register("name", { validate: (v) => v.trim() !== "" || "Enter your name" })} />
                {errors.name ? <p className="font-mono text-xs text-destructive">{errors.name.message}</p> : null}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                autoFocus={mode === "login"}
                className="font-mono"
                {...register("email", { validate: (v) => /^\S+@\S+\.\S+$/.test(v) || "Enter a valid email" })}
              />
              {errors.email ? <p className="font-mono text-xs text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                {...register("password", {
                  validate: (v) => (mode === "signup" ? v.length >= 8 || "Use at least 8 characters" : v.length > 0 || "Enter your password"),
                })}
              />
              {errors.password ? <p className="font-mono text-xs text-destructive">{errors.password.message}</p> : null}
            </div>
          </div>

          <div className="space-y-3 border-t px-6 py-4">
            {error || sessionError ? (
              <p role="alert" className="font-mono text-xs text-destructive">
                {error ?? sessionError}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Please wait…" : text.submit}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {text.switchText}{" "}
              <Link to={switchHref} className="font-medium text-brand hover:underline">
                {text.switchLink}
              </Link>
            </p>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
