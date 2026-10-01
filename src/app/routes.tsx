import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AuthPage } from "@/pages/AuthPage";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DatabaseGate } from "./DatabaseGate";

// App pages load on demand so the landing and auth pages stay light.
const page = (load: () => Promise<Record<string, React.ComponentType>>, name: string): RouteObject["lazy"] =>
  async () => ({ Component: (await load())[name] });

// The RiverX editor preview serves the app under /preview/<session>/__frame/; route below that
// prefix there, and from / everywhere else.
const previewBasename = window.location.pathname.match(/^\/preview\/[^/]+\/__frame/)?.[0];

export const router = createBrowserRouter(
  [
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <AuthPage mode="login" /> },
    { path: "/signup", element: <AuthPage mode="signup" /> },
    {
      path: "/app",
      element: <RequireAuth />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              element: <DatabaseGate />,
              children: [
                { index: true, lazy: page(() => import("@/pages/DashboardPage"), "DashboardPage") },
                { path: "companies", lazy: page(() => import("@/pages/CompaniesPage"), "CompaniesPage") },
                { path: "companies/:id", lazy: page(() => import("@/pages/CompanyDetailPage"), "CompanyDetailPage") },
                { path: "contacts", lazy: page(() => import("@/pages/ContactsPage"), "ContactsPage") },
                { path: "contacts/:id", lazy: page(() => import("@/pages/ContactDetailPage"), "ContactDetailPage") },
                { path: "deals", lazy: page(() => import("@/pages/DealsPage"), "DealsPage") },
                { path: "deals/:id", lazy: page(() => import("@/pages/DealDetailPage"), "DealDetailPage") },
                { path: "tasks", lazy: page(() => import("@/pages/TasksPage"), "TasksPage") },
              ],
            },
            { path: "settings", lazy: page(() => import("@/pages/SettingsPage"), "SettingsPage") },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
  {
    basename: previewBasename,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
