import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import AdminRoute from "@/components/admin-route";
import AutoLogout from "@/components/auto-logout";
import AppShell, { ADMIN_ROUTE, PAGE_FALLBACK, withSecurity } from "./AppShell";
import { isAdminPath } from "./lib/admin-routing";

const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const CEODashboard = lazy(() => import("@/pages/admin/ceo-dashboard"));
const BusinessIntelligence = lazy(() => import("@/pages/admin/business-intelligence"));
const AddActivity = lazy(() => import("@/pages/add-activity"));
const AdminAccessGuide = lazy(() => import("@/components/admin-access-guide"));
const NotFound = lazy(() => import("@/pages/not-found"));

function StaffSessionRuntime() {
  const [location] = useLocation();
  if (!isAdminPath(location)) return null;
  return <AutoLogout timeoutMinutes={5} warningMinutes={1} />;
}

function AdminRouter() {
  return (
    <>
      <StaffSessionRuntime />
      <Switch>
        <Route path="/admin/login" component={withSecurity(AdminLogin, ADMIN_ROUTE)} />
        <Route path="/admin/dashboard" component={withSecurity(AdminDashboard, ADMIN_ROUTE)} />
        <Route path="/admin" component={withSecurity(AdminDashboard, ADMIN_ROUTE)} />
        <Route path="/admin/ceo" component={withSecurity(CEODashboard, ADMIN_ROUTE)} />
        <Route path="/admin/business-intelligence" component={withSecurity(BusinessIntelligence, ADMIN_ROUTE)} />
        <Route path="/admin/activities/new">
          {() => <AdminRoute requireSuperAdmin><Suspense fallback={PAGE_FALLBACK}><AddActivity /></Suspense></AdminRoute>}
        </Route>
        <Route path="/admin/access-guide">
          {() => <AdminRoute><Suspense fallback={PAGE_FALLBACK}><AdminAccessGuide /></Suspense></AdminRoute>}
        </Route>
        <Route component={withSecurity(NotFound, ADMIN_ROUTE)} />
      </Switch>
    </>
  );
}

export default function AdminApp() {
  return <AppShell><AdminRouter /></AppShell>;
}
