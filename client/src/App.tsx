import { lazy, Suspense, type ComponentProps, type ComponentType, type LazyExoticComponent } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SecurityProvider } from "@/hooks/use-security";
import { LanguageProvider } from "@/hooks/use-language";
import SecurityWrapper from "@/components/security-wrapper";
import AutoLogout from "@/components/auto-logout";
import { ErrorBoundary } from "@/components/error-boundary";

const Home = lazy(() => import("@/pages/home"));
const Activities = lazy(() => import("@/pages/activities"));
const Booking = lazy(() => import("@/pages/booking-fixed"));
const Reviews = lazy(() => import("@/pages/reviews"));
const Contact = lazy(() => import("@/pages/contact"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const CEODashboard = lazy(() => import("@/pages/admin/ceo-dashboard"));
const PerformanceDashboard = lazy(() => import("@/pages/admin/performance-dashboard"));
const AdminAccessGuide = lazy(() => import("@/components/admin-access-guide"));
const NotFound = lazy(() => import("@/pages/not-found"));

type LazyComponent = LazyExoticComponent<ComponentType<Record<string, unknown>>>;
type SecurityOptions = Partial<ComponentProps<typeof SecurityWrapper>>;

const PAGE_FALLBACK = (
  <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
    Loading experience...
  </div>
);

const withSecurity = (Component: LazyComponent, options: SecurityOptions) => () => (
  <SecurityWrapper {...options}>
    <Suspense fallback={PAGE_FALLBACK}>
      <Component />
    </Suspense>
  </SecurityWrapper>
);

const PUBLIC_ROUTE: SecurityOptions = {
  showSecurityStatus: false,
  enableThreatDetection: false
};

const BOOKING_ROUTE: SecurityOptions = {
  ...PUBLIC_ROUTE,
  requireSecureConnection: false,
  logPageView: false
};

const ADMIN_ROUTE: SecurityOptions = {
  showSecurityStatus: true,
  enableThreatDetection: true,
  requireSecureConnection: false
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={withSecurity(Home, PUBLIC_ROUTE)} />
      <Route path="/activities" component={withSecurity(Activities, PUBLIC_ROUTE)} />
      <Route path="/reviews" component={withSecurity(Reviews, PUBLIC_ROUTE)} />
      <Route path="/contact" component={withSecurity(Contact, PUBLIC_ROUTE)} />
      <Route path="/booking" component={withSecurity(Booking, BOOKING_ROUTE)} />
      <Route path="/admin/login" component={withSecurity(AdminLogin, ADMIN_ROUTE)} />
      <Route path="/admin/ceo" component={withSecurity(CEODashboard, ADMIN_ROUTE)} />
      <Route path="/admin/dashboard" component={withSecurity(AdminDashboard, ADMIN_ROUTE)} />
      <Route path="/admin" component={withSecurity(AdminDashboard, ADMIN_ROUTE)} />
      <Route path="/admin/performance" component={withSecurity(PerformanceDashboard, ADMIN_ROUTE)} />
      <Route path="/admin/access-guide" component={withSecurity(AdminAccessGuide, PUBLIC_ROUTE)} />
      <Route component={withSecurity(NotFound, PUBLIC_ROUTE)} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        if (process.env.NODE_ENV === 'production') {
          console.error('App Error:', { error: error.message, errorInfo });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <LanguageProvider>
            <TooltipProvider>
              <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
                rel="stylesheet"
              />
              <Toaster />
              <AutoLogout timeoutMinutes={5} warningMinutes={1} />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </SecurityProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
