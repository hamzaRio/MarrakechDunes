import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { LanguageProvider } from "@/hooks/use-language";
import { ErrorBoundary } from "@/components/error-boundary";

// Essential pages only
const Home = lazy(() => import("@/pages/home"));
const Activities = lazy(() => import("@/pages/activities"));
const Booking = lazy(() => import("@/pages/booking-fixed"));
const Contact = lazy(() => import("@/pages/contact"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

const PAGE_FALLBACK = (
  <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
    Loading...
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <Home />
        </Suspense>
      )} />
      <Route path="/activities" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <Activities />
        </Suspense>
      )} />
      <Route path="/contact" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <Contact />
        </Suspense>
      )} />
      <Route path="/booking" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <Booking />
        </Suspense>
      )} />
      <Route path="/admin/login" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <AdminLogin />
        </Suspense>
      )} />
      {/* Single admin dashboard - no more multiple dashboards */}
      <Route path="/admin" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <AdminDashboard />
        </Suspense>
      )} />
      <Route path="/admin/dashboard" component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <AdminDashboard />
        </Suspense>
      )} />
      <Route component={() => (
        <Suspense fallback={PAGE_FALLBACK}>
          <NotFound />
        </Suspense>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Router />
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
