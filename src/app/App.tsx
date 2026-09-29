import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { crmConfig } from "@/config/crm";
import { AuthProviderRoot } from "@/features/auth/auth-context";
import { router } from "./routes";
import "../styles/globals.css";

export function App() {
  useEffect(() => {
    document.title = crmConfig.appName;
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProviderRoot>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <Toaster />
      </AuthProviderRoot>
    </ThemeProvider>
  );
}
