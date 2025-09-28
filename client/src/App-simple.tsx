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
      <Route path="/" component={Home} />
      <Route path="/activities" component={Activities} />
      <Route path="/booking" component={Booking} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <div className="min-h-screen bg-background">
            <Router />
          </div>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
