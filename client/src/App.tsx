import { lazy, Suspense, useEffect, type ComponentProps, type ComponentType, type LazyExoticComponent } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SecurityProvider } from "@/hooks/use-security";
import { LanguageProvider } from "@/hooks/use-language";
import SecurityWrapper from "@/components/security-wrapper";
const AutoLogout = lazy(() => import("@/components/auto-logout"));
import { ErrorBoundary } from "@/components/error-boundary";
import { HelmetProvider } from "react-helmet-async";
import ReactGA from "react-ga4";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

const Home = lazy(() => import("@/pages/home"));
const Activities = lazy(() => import("@/pages/activities"));
const SimplifiedActivities = lazy(() => import("@/pages/simplified-activities"));
const ActivityDetail = lazy(() => import("@/pages/activity-detail"));
const Booking = lazy(() => import("@/pages/booking-fixed"));
const BookingConfirmationPage = lazy(() => import("@/components/booking-confirmation-page"));
const Reviews = lazy(() => import("@/pages/reviews"));
const Contact = lazy(() => import("@/pages/contact"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const CEODashboard = lazy(() => import("@/pages/admin/ceo-dashboard"));
// Removed duplicate dashboard imports
const AdminAccessGuide = lazy(() => import("@/components/admin-access-guide"));
const CustomerPortal = lazy(() => import("@/pages/customer-portal"));
const BusinessIntelligence = lazy(() => import("@/pages/admin/business-intelligence"));
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
      <Route path="/activities-simple" component={withSecurity(SimplifiedActivities, PUBLIC_ROUTE)} />
      <Route path="/activity/:id" component={withSecurity(ActivityDetail, PUBLIC_ROUTE)} />
      <Route path="/reviews" component={withSecurity(Reviews, PUBLIC_ROUTE)} />
      <Route path="/contact" component={withSecurity(Contact, PUBLIC_ROUTE)} />
            <Route path="/booking">
              {() => (
                <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading...</div>}>
                  <Booking />
                </Suspense>
              )}
            </Route>
            <Route path="/confirmation-and-pay">
              {() => (
                <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading...</div>}>
                  <BookingConfirmationPage />
                </Suspense>
              )}
            </Route>
      <Route path="/admin/login" component={withSecurity(AdminLogin, ADMIN_ROUTE)} />
      <Route path="/admin/dashboard" component={withSecurity(AdminDashboard, ADMIN_ROUTE)} />
      <Route path="/admin/ceo" component={withSecurity(CEODashboard, ADMIN_ROUTE)} />
      <Route path="/admin" component={withSecurity(AdminDashboard, ADMIN_ROUTE)} />
      <Route path="/admin/business-intelligence" component={withSecurity(BusinessIntelligence, ADMIN_ROUTE)} />
      <Route path="/admin/access-guide" component={withSecurity(AdminAccessGuide, PUBLIC_ROUTE)} />
      <Route path="/customer" component={withSecurity(CustomerPortal, PUBLIC_ROUTE)} />
      <Route component={withSecurity(NotFound, PUBLIC_ROUTE)} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && import.meta.env.PROD) {
      ReactGA.initialize(gaId);
      console.log('Google Analytics initialized');
    }
  }, []);

  // Track page views
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && import.meta.env.PROD) {
      try {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
      } catch (error) {
        // Silently fail GA tracking to prevent breaking the app
        if (import.meta.env.DEV) {
          console.warn('[GA] Failed to track pageview:', error);
        }
      }
    }
  }, [window.location.pathname]);

  return (
    <HelmetProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
        if (import.meta.env.PROD) {
          console.error('App Error:', { error: error.message, errorInfo });
        }
      }}
    >
      <QueryClientProvider client={getQueryClient()}>
        <SecurityProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Suspense fallback={null}>
                <AutoLogout timeoutMinutes={5} warningMinutes={1} />
              </Suspense>
              <PWAInstallPrompt />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </SecurityProvider>
      </QueryClientProvider>
    </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
