import { Suspense, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SecurityProvider } from "@/hooks/use-security";
import { LanguageProvider } from "@/hooks/use-language";
import SecurityWrapper from "@/components/security-wrapper";
import { ErrorBoundary } from "@/components/error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { getQueryClient } from "./lib/queryClient";

export const PAGE_FALLBACK = (
  <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
    Loading experience...
  </div>
);

export const PUBLIC_ROUTE = {
  showSecurityStatus: false,
  enableThreatDetection: false,
};

export const BOOKING_ROUTE = {
  ...PUBLIC_ROUTE,
  requireSecureConnection: false,
  logPageView: false,
};

export const ADMIN_ROUTE = {
  showSecurityStatus: true,
  enableThreatDetection: true,
  requireSecureConnection: false,
};

export function withSecurity(Component: React.ComponentType, options: typeof PUBLIC_ROUTE) {
  return () => (
    <SecurityWrapper {...options}>
      <Suspense fallback={PAGE_FALLBACK}><Component /></Suspense>
    </SecurityWrapper>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          if (import.meta.env.PROD) console.error("App Error:", { error: error.message, errorInfo });
        }}
      >
        <QueryClientProvider client={getQueryClient()}>
          <SecurityProvider>
            <LanguageProvider>
              <TooltipProvider>
                <Toaster />
                {children}
              </TooltipProvider>
            </LanguageProvider>
          </SecurityProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
